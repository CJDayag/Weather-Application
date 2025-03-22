import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TermsDialog } from "@/components/TermsDialog";
import { PrivacyDialog } from "@/components/PrivacyDialog";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const API_URL = import.meta.env.VITE_API_URL;
const CSRF_URL = import.meta.env.VITE_CSRF_URL;
const SIGNUP_URL = import.meta.env.VITE_SIGNUP_URL;

export function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors },
  } = useForm<SignupFormData>();

  const password = watch("password");
  
  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      setErrors([]);
  
      if (data.password !== data.confirmPassword) {
        setErrors(["Passwords do not match"]);
        return;
      }
  
      const csrfResponse = await fetch(`${API_URL}${CSRF_URL}`, {
        method: "GET",
        credentials: "include", 
      });
  
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
  
      const response = await fetch(`${API_URL}${SIGNUP_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,  
        },
        credentials: "include",  
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
        }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create account");
      }
  
      toast.success("Account Created Successfully", { duration: 3000 });

      setTimeout(() => {
        navigate("/login", { state: { message: "Account created successfully" } });
      }, 3000);
  
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Signup failed"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkClick = () => {
    setLinkLoading(true);
    setTimeout(() => {
      navigate("/login");
    }, 1000); 
  };

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible((prev) => !prev);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position='top-right' />
      <div className="w-full max-w-[500px]">
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your information to get started
                </p>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register("firstName", { required: "First name is required" })}
                      type="text"
                      disabled={isLoading}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-500">{formErrors.firstName.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register("lastName", { required: "Last name is required" })}
                      type="text"
                      disabled={isLoading}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-500">{formErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    disabled={isLoading}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...register("username", { required: "Username is required" })}
                    type="text"
                    disabled={isLoading}
                  />
                  {formErrors.username && (
                    <p className="text-sm text-red-500">{formErrors.username.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      className="pe-9"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                      })}
                      type={isPasswordVisible ? "text" : "password"}
                      disabled={isLoading}
                    />
                    <button
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={togglePasswordVisibility}
                      aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                      aria-pressed={isPasswordVisible}
                    >
                      {isPasswordVisible ? (
                        <EyeOffIcon size={16} aria-hidden="true" />
                      ) : (
                        <EyeIcon size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      className="pe-9"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) => value === password || "Passwords do not match",
                      })}
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      disabled={isLoading}
                    />
                    <button
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                      aria-pressed={isConfirmPasswordVisible}
                    >
                      {isConfirmPasswordVisible ? (
                        <EyeOffIcon size={16} aria-hidden="true" />
                      ) : (
                        <EyeIcon size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{formErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : null}
                  Create Account
                </Button>

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleLinkClick}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {linkLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 inline-block" />
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
        <div className="text-muted-foreground text-center text-xs mt-4">
          By clicking continue, you agree to our{" "}
          <TermsDialog />{" "}
          and <PrivacyDialog />.
        </div>
      </div>
    </div>
  );
}
