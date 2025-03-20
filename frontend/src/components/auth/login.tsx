import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, CircleCheckIcon } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LoginFormData {
  username: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_URL = import.meta.env.VITE_LOGIN_URL;
const PROFILE_URL = import.meta.env.VITE_PROFILE_URL;

export function LoginPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const usernameId = useId();
  const passwordId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}${TOKEN_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Login failed");

      console.log("Login Response:", result); // Debugging
      console.log("Full user data fetched from API:", result.user);

      // ✅ Extract username correctly
      const fullUser = await fetch(`${API_URL}${PROFILE_URL}`, {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${result.access}`,
        }
    }).then(res => res.json());
    
      localStorage.setItem("user", JSON.stringify(fullUser));
      localStorage.setItem("access_token", result.access);
      localStorage.setItem("refresh_token", result.refresh);
      localStorage.setItem("justLoggedIn", "true");

      // Show success toast and delay navigation 3 seconds
      const toastId = toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
                <div className="flex grow gap-3">
                    <CircleCheckIcon
                        className="mt-0.5 shrink-0 text-emerald-500"
                        size={16}
                        aria-hidden="true"
                    />
                    <div className="flex grow justify-between gap-12">
                        <p className="text-sm">Log in Successfully!</p>
                    </div>
                </div>
            </div>
        </div>
    ));
    setTimeout(() => {
      toast.dismiss(toastId);
  }, 3000);

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkClick = () => {
    setLinkLoading(true);
    setTimeout(() => {
      navigate("/signup");
    }, 1000); // Delay of 1 second
  };

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
    <div className={cn("w-full max-w-[800px]", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to your account
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor={usernameId}>Username</Label>
                <Input
                  id={usernameId}
                  {...register("username", { required: "Username is required" })}
                  type="text"
                  disabled={isLoading}
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={passwordId}>Password</Label>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // Add your forgot password navigation logic here
                        navigate("/forgot-password");
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id={passwordId}
                      {...register("password", { required: "Password is required" })}
                      type={isVisible ? "text" : "password"}
                      disabled={isLoading}
                      className={`${errors.password ? "border-red-500" : ""} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isVisible ? "Hide password" : "Show password"}
                    >
                      {isVisible ? (
                        <EyeOffIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : null}
                Sign in
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={handleLinkClick}
                  className="underline underline-4 hover:text-primary"
                >
                  {linkLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black inline-block" />
                  ) : (
                    "Sign up"
                  )}
                </button>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden h-full md:block">
            <img
              src="/images/weather_logo.png"
              alt="Login background"
              className="absolute inset-0 h-full w-full object-cover object-center dark:brightness-[0.2] dark:grayscale"
              style={{ minHeight: '100%' }}
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs mt-4">
        By clicking continue, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
        and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
      </div>
    </div>
  </div>
  )
};