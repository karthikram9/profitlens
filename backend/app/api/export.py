import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.api.uploads import get_current_user
from app.db.models import User, Upload
from app.db.session import get_db
from app.services.export_service import (
    generate_csv_export,
    generate_excel_export,
    generate_pdf_export,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_ready_upload(db: Session, user: User) -> Upload:
    upload = (
        db.query(Upload)
        .filter(Upload.user_id == user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )
    if not upload or upload.status != "ready":
        raise HTTPException(status_code=404, detail="No ready upload found to export.")
    return upload


@router.get("/csv")
def export_csv_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = _get_ready_upload(db, current_user)
    try:
        csv_content = generate_csv_export(db, str(upload.id))
        filename = f"ProfitLens_Orders_{upload.original_filename.replace('.csv', '')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        logger.error("Error exporting CSV for upload %s: %s", upload.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate CSV export.")


@router.get("/excel")
def export_excel_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = _get_ready_upload(db, current_user)
    try:
        excel_bytes = generate_excel_export(db, str(upload.id))
        filename = f"ProfitLens_Report_{upload.original_filename.replace('.csv', '')}.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        logger.error("Error exporting Excel for upload %s: %s", upload.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate Excel export.")


@router.get("/pdf")
def export_pdf_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = _get_ready_upload(db, current_user)
    try:
        pdf_bytes = generate_pdf_export(db, str(upload.id))
        filename = f"ProfitLens_Executive_Report_{upload.original_filename.replace('.csv', '')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        logger.error("Error exporting PDF for upload %s: %s", upload.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.")
