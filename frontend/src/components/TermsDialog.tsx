import { useState } from "react";
import { CustomDialog } from "./CustomDialog";

export const TermsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Terms of Service"
      triggerText="Terms of Service"
    >
      <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-6">
        <p className="font-semibold">
          Welcome to our Weather Application. By using this service, you agree to these terms:
        </p>
        
        <section className="space-y-2">
          <h3 className="font-medium">1. Service Description</h3>
          <p>
            This application provides weather forecasts, historical weather data, and weather alerts. 
            While we strive for accuracy, weather predictions are inherently uncertain.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">2. User Responsibilities</h3>
          <p>
            Users are responsible for maintaining the security of their account credentials and 
            ensuring their location data is accurate. Do not share your account information with others.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">3. Data Usage</h3>
          <p>
            We collect location data to provide weather information. Your data is handled according 
            to our privacy policy and is only used to improve our service.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">4. Service Reliability</h3>
          <p>
            While we strive to maintain 24/7 availability, we cannot guarantee uninterrupted access 
            to weather data. Service interruptions may occur for maintenance or technical issues.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">5. Disclaimer</h3>
          <p>
            Weather information is provided "as is" without any warranties. Users should not rely 
            solely on this application for critical weather-related decisions.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Last updated: March 2024
        </p>
      </div>
    </CustomDialog>
  );
};