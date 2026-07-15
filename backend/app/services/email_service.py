class EmailService:
    def send_password_reset_email(self, to_email: str, reset_link: str) -> None:
        """
        Sends a password reset email to the user.
        """
        raise NotImplementedError

class DevEmailService(EmailService):
    def send_password_reset_email(self, to_email: str, reset_link: str) -> None:
        print("="*50)
        print(f"DEV EMAIL MOCK: Password reset requested for {to_email}")
        print(f"Click here to reset your password: {reset_link}")
        print("="*50)

# Use dev email service by default
email_service = DevEmailService()
