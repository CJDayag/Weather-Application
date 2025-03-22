import { useState } from "react";
import { CustomDialog } from "./CustomDialog";

export const PrivacyDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Privacy Policy"
      triggerText="Privacy Policy"
    >
      <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-6">
        <p className="font-semibold">
          Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
        </p>

        <section className="space-y-2">
          <h3 className="font-medium">1. Information We Collect</h3>
          <p>
            We collect the following information to provide you with accurate weather services:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Location data (city, coordinates)</li>
            <li>Account information (email, password)</li>
            <li>Usage data (weather searches, preferred locations)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">2. How We Use Your Information</h3>
          <p>
            Your information is used to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate weather forecasts for your locations</li>
            <li>Send weather alerts and notifications</li>
            <li>Improve our weather services and user experience</li>
            <li>Maintain and secure your account</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">3. Data Protection</h3>
          <p>
            We implement security measures to protect your personal information from unauthorized 
            access, alteration, or disclosure. Your data is encrypted and stored securely.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">4. Data Sharing</h3>
          <p>
            We do not sell or share your personal information with third parties. We may share 
            anonymous, aggregated data for improving our weather forecasting accuracy.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">5. Your Rights</h3>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of non-essential data collection</li>
          </ul>
        </section>

        <p className="text-xs text-muted-foreground mt-6">
          Last updated: March 2024
        </p>
      </div>
    </CustomDialog>
  );
};