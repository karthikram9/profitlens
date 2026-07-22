import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api-client';
import { Card } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

interface ExclusionReason {
  reason: string;
  count: number;
}

interface DataHealthData {
  uploadId: string;
  healthScore: number;
  totalRows: number;
  processedRows: number;
  excludedRows: number;
  exclusionReasons: ExclusionReason[];
}

export const DataHealthTab: React.FC = () => {
  const [data, setData] = useState<DataHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await apiRequest<DataHealthData>('/data-health');
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch data health metrics.');
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="p-xl flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error || !data) {
    return <div className="p-xl text-center text-danger">{error}</div>;
  }

  const scoreColor = data.healthScore >= 95 ? 'text-success' : data.healthScore >= 80 ? 'text-warning-dark' : 'text-danger';

  return (
    <div className="space-y-lg animate-fade-in pb-20">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Data Health</h2>
        <p className="text-sm text-text-secondary mt-1">
          Monitor the completeness and quality of your dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <Card>
          <div className="p-md flex flex-col justify-center items-center h-full">
            <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Health Score</span>
            <span className={`text-5xl font-bold mt-2 ${scoreColor}`}>{data.healthScore}%</span>
            <span className="text-xs text-text-muted mt-2 text-center">Percentage of rows successfully processed</span>
          </div>
        </Card>
        
        <Card className="md:col-span-2" headerSlot={<h3 className="text-lg font-semibold text-text-primary">Processing Summary</h3>}>
          <div className="grid grid-cols-3 gap-sm text-center py-sm">
              <div>
                <p className="text-2xl font-bold text-text-primary">{data.totalRows.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Total Rows</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{data.processedRows.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Processed successfully</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-danger">{data.excludedRows.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Excluded</p>
              </div>
            </div>
        </Card>
      </div>

      <Card headerSlot={<h3 className="text-lg font-semibold text-text-primary">Exclusion Reasons</h3>}>
          {data.exclusionReasons.length === 0 ? (
            <p className="text-sm text-text-secondary p-4 text-center">No rows were excluded during processing.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.exclusionReasons.map(r => (
                  <TableRow key={r.reason}>
                    <TableCell className="font-medium text-text-primary">{r.reason}</TableCell>
                    <TableCell>{r.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </Card>
    </div>
  );
};
