import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          
          // Success toast class
          success:
            "group-[.toast]:bg-green-500 group-[.toast]:text-white group-[.toast]:border-green-600",
          
          // Error toast class
          error:
            "group-[.toast]:bg-red-500 group-[.toast]:text-white group-[.toast]:border-red-600",
          
          // Info toast class
          info:
            "group-[.toast]:bg-blue-500 group-[.toast]:text-white group-[.toast]:border-blue-600",
          
          // Warning toast class
          warning:
            "group-[.toast]:bg-yellow-500 group-[.toast]:text-black group-[.toast]:border-yellow-600",
          
          // For action buttons, make sure you also have different styles for each
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
