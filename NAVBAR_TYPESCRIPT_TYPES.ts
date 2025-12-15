/**
 * TypeScript Types Reference for Navbar & LoginSignupModal
 * 
 * This file documents all TypeScript types, interfaces, and types used
 * in the new authentication components.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LoginSignupModal Props
 */
interface LoginSignupModalProps {
  /** Whether the modal is open or closed */
  isOpen: boolean;
  
  /** Callback function when modal should close */
  onClose: () => void;
}

/**
 * Login/Signup Form State
 */
interface FormState {
  /** User's email address */
  email: string;
  
  /** User's password */
  password: string;
  
  /** Password confirmation (signup only) */
  confirmPassword: string;
  
  /** User's full name (signup only) */
  fullName: string;
}

/**
 * Form Validation Errors
 */
interface FormErrors {
  /** Email field error message */
  email?: string;
  
  /** Password field error message */
  password?: string;
  
  /** Confirm password field error message */
  confirmPassword?: string;
  
  /** Full name field error message */
  fullName?: string;
  
  /** General form error (e.g., auth failed) */
  general?: string;
}

/**
 * Tab Type for Login/Signup Modal
 */
type Tab = "login" | "signup";

/**
 * Testimonial/Quote object
 */
interface Testimonial {
  /** The quote/testimonial text */
  quote: string;
  
  /** Author or source of the quote */
  author: string;
  
  /** Emoji to display with the quote */
  emoji: string;
}

/**
 * User Profile from Supabase
 */
interface UserProfile {
  /** User's full name */
  full_name: string | null;
  
  /** URL to user's avatar image */
  avatar_url: string | null;
  
  /** User's phone number (optional) */
  phone?: string | null;
  
  /** User's bio (optional) */
  bio?: string | null;
  
  /** Any other profile fields you add */
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION TYPES (From AuthContext)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Authentication Context Type
 * 
 * Available from useAuth() hook:
 * const { user, session, loading, signUp, signIn, signOut, ... } = useAuth();
 */
interface AuthContextType {
  /** Current authenticated user (null if logged out) */
  user: User | null;
  
  /** Current session (null if logged out) */
  session: Session | null;
  
  /** Whether auth state is being loaded */
  loading: boolean;
  
  /** Sign up with email/password */
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  
  /** Sign in with email/password */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  
  /** Sign in with Google OAuth */
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  
  /** Sign in with Facebook OAuth */
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  
  /** Sign out current user */
  signOut: () => Promise<void>;
}

/**
 * Supabase User Type
 * 
 * Properties:
 * - id: UUID of the user
 * - email: User's email address
 * - user_metadata: Custom metadata (may contain full_name, avatar_url)
 * - email_confirmed_at: When email was confirmed
 * - created_at: Account creation timestamp
 */
import type { User, Session, AuthError } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE DATABASE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Profiles Table Row Type
 */
interface ProfilesRow {
  /** UUID of the user (foreign key to auth.users) */
  id: string;
  
  /** User's full name */
  full_name: string | null;
  
  /** URL to user's avatar image */
  avatar_url: string | null;
  
  /** User's phone number */
  phone: string | null;
  
  /** User's biography */
  bio: string | null;
  
  /** When the profile was created */
  created_at: string;
  
  /** When the profile was last updated */
  updated_at: string | null;
  
  /** Any additional fields you add to the table */
  [key: string]: any;
}

/**
 * Auth Error Type from Supabase
 */
interface SupabaseError {
  /** Error message */
  message: string;
  
  /** Error code (e.g., "invalid_grant") */
  code?: string;
  
  /** HTTP status code */
  status?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION SIGNATURES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign Up Function
 * 
 * Usage:
 * const { error } = await signUp("user@example.com", "password123", "John Doe");
 * if (error) {
 *   console.error("Signup failed:", error.message);
 * }
 */
type SignUpFunction = (
  email: string,
  password: string,
  fullName: string
) => Promise<{ error: AuthError | null }>;

/**
 * Sign In Function
 * 
 * Usage:
 * const { error } = await signIn("user@example.com", "password123");
 * if (error) {
 *   console.error("Login failed:", error.message);
 * }
 */
type SignInFunction = (
  email: string,
  password: string
) => Promise<{ error: AuthError | null }>;

/**
 * Google Sign In Function
 * 
 * Usage:
 * const { error } = await signInWithGoogle();
 */
type SignInWithGoogleFunction = () => Promise<{ error: AuthError | null }>;

/**
 * Sign Out Function
 * 
 * Usage:
 * await signOut();
 */
type SignOutFunction = () => Promise<void>;

/**
 * Form Validation Function
 * 
 * Returns: true if form is valid, false if there are errors
 */
type ValidateFunction = () => boolean;

/**
 * Handle Input Change Function
 * 
 * Usage:
 * handleInputChange("email", "user@example.com");
 */
type HandleInputChangeFunction = (field: keyof FormState, value: string) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Form Submit Handler
 * 
 * Usage:
 * <form onSubmit={handleLogin}>...</form>
 */
type FormSubmitHandler = (e: React.FormEvent) => Promise<void>;

/**
 * Input Change Handler
 * 
 * Usage:
 * <input onChange={(e) => handleInputChange("email", e.target.value)} />
 */
type InputChangeHandler = (field: keyof FormState, value: string) => void;

/**
 * Button Click Handler
 * 
 * Usage:
 * <button onClick={handleButtonClick}>...</button>
 */
type ButtonClickHandler = () => void | Promise<void>;

/**
 * Dropdown Item Click Handler
 * 
 * Usage:
 * <Link onClick={() => handleMenuItemClick()}>...</Link>
 */
type MenuItemClickHandler = () => void;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * API Response Type
 * 
 * Usage:
 * const response: ApiResponse<UserProfile> = await fetchUserProfile();
 * if (!response.error) {
 *   console.log(response.data);
 * }
 */
interface ApiResponse<T = any> {
  /** Response data */
  data: T | null;
  
  /** Error object if operation failed */
  error: SupabaseError | null;
}

/**
 * Async State Type
 * 
 * Useful for managing async operation state
 */
interface AsyncState<T = any> {
  /** Current data */
  data: T | null;
  
  /** Is loading? */
  loading: boolean;
  
  /** Error if any */
  error: Error | null;
}

/**
 * Optional Type Utility
 * 
 * Usage:
 * type OptionalUser = Optional<User, "email">;
 */
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Readonly Type Utility
 * 
 * Usage:
 * type ReadonlyUser = Readonly<User>;
 */
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Supabase Select Response
 * 
 * Usage:
 * const { data, error } = await supabase
 *   .from("profiles")
 *   .select("*")
 *   .single();
 * 
 * Type:
 * data: ProfilesRow | null
 * error: PostgrestError | null
 */
interface SelectResponse<T> {
  data: T | null;
  error: any;
}

/**
 * Supabase Select Multiple Response
 * 
 * Usage:
 * const { data, error } = await supabase
 *   .from("profiles")
 *   .select("*");
 * 
 * Type:
 * data: T[]
 * error: PostgrestError | null
 */
interface SelectManyResponse<T> {
  data: T[];
  error: any;
}

/**
 * Supabase Insert Response
 * 
 * Usage:
 * const { data, error } = await supabase
 *   .from("profiles")
 *   .insert([{ ... }])
 *   .select();
 */
interface InsertResponse<T> {
  data: T[] | null;
  error: any;
}

/**
 * Supabase Update Response
 * 
 * Usage:
 * const { data, error } = await supabase
 *   .from("profiles")
 *   .update({ ... })
 *   .eq("id", userId)
 *   .select();
 */
interface UpdateResponse<T> {
  data: T[] | null;
  error: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Example 1: Type a Component Props
 * 
 * const MyComponent: React.FC<LoginSignupModalProps> = ({ isOpen, onClose }) => {
 *   return <div>Component</div>;
 * };
 */

/**
 * Example 2: Type a Form State Variable
 * 
 * const [formData, setFormData] = useState<FormState>({
 *   email: "",
 *   password: "",
 *   confirmPassword: "",
 *   fullName: "",
 * });
 */

/**
 * Example 3: Type a Custom Hook Return
 * 
 * function useUserProfile(userId: string): AsyncState<UserProfile> {
 *   const [state, setState] = useState<AsyncState<UserProfile>>({
 *     data: null,
 *     loading: true,
 *     error: null,
 *   });
 *   // ... implementation
 *   return state;
 * }
 */

/**
 * Example 4: Type a Function Parameter
 * 
 * function handleInputChange(field: keyof FormState, value: string) {
 *   // field is now typed as "email" | "password" | "confirmPassword" | "fullName"
 * }
 */

/**
 * Example 5: Type a Supabase Query
 * 
 * const { data, error } = await supabase
 *   .from("profiles")
 *   .select("*")
 *   .eq("id", userId)
 *   .single() as SelectResponse<ProfilesRow>;
 */

/**
 * Example 6: Type a Validation Error State
 * 
 * const [errors, setErrors] = useState<FormErrors>({});
 * 
 * // Now TypeScript knows about: errors.email, errors.password, etc.
 * if (errors.email) {
 *   console.log(errors.email); // Type is string | undefined
 * }
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * How to import Supabase types:
 * 
 * import type { User, Session, AuthError } from "@supabase/supabase-js";
 * 
 * How to import component types:
 * 
 * import type { LoginSignupModalProps } from "@/components/auth/LoginSignupModal";
 * 
 * How to import auth context types:
 * 
 * import type { AuthContextType } from "@/contexts/AuthContext";
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STRICT TYPE CHECKING TIPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 1. Always type your useState:
 *    ✅ const [user, setUser] = useState<User | null>(null);
 *    ❌ const [user, setUser] = useState(null);
 * 
 * 2. Always type your useEffect dependencies:
 *    ✅ useEffect(() => { ... }, [user, loading]);
 *    ❌ useEffect(() => { ... }, []);
 * 
 * 3. Always use proper null checks:
 *    ✅ if (user) { console.log(user.email); }
 *    ❌ console.log(user.email);
 * 
 * 4. Use type guards:
 *    ✅ if (error && typeof error.message === "string") { ... }
 *    ❌ console.log(error.message);
 * 
 * 5. Use strict mode in tsconfig.json:
 *    ✅ "strict": true
 *    ❌ "strict": false
 * 
 * 6. Use Partial for optional updates:
 *    ✅ type UpdatedProfile = Partial<UserProfile>;
 *    ❌ type UpdatedProfile = UserProfile;
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RUNTIME TYPE CHECKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Runtime type guards help catch errors at runtime
 */

/**
 * Check if value is a FormError object
 */
function isFormError(value: any): value is FormErrors {
  return (
    typeof value === "object" &&
    value !== null &&
    (typeof value.email === "string" ||
     typeof value.password === "string" ||
     typeof value.general === "string")
  );
}

/**
 * Check if value is a User
 */
function isUser(value: any): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "string" &&
    typeof value.email === "string"
  );
}

/**
 * Check if value is a UserProfile
 */
function isUserProfile(value: any): value is UserProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    (typeof value.full_name === "string" || value.full_name === null) &&
    (typeof value.avatar_url === "string" || value.avatar_url === null)
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// You now have complete type safety! 🎉
// ═══════════════════════════════════════════════════════════════════════════════
