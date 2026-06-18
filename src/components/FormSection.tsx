import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Send,
    CheckCircle2,
    AlertCircle,
    Heart,
    Award,
    ArrowUpRight,
    GraduationCap,
} from "lucide-react";

interface FormSectionProps {
    onFormSubmitted: () => void;
    apiStatus: string | null;
}

export default function FormSection({
    onFormSubmitted,
    apiStatus,
}: FormSectionProps) {
    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const [errors, setErrors] = useState<
        Partial<{ name: string; email: string; message: string }>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    // Real-time Field Validation
    const validateForm = () => {
        const tempErrors: Partial<{
            name: string;
            email: string;
            message: string;
        }> = {};
        let isValid = true;

        if (!name.trim()) {
            tempErrors.name = "Full name is required.";
            isValid = false;
        }

        if (!email.trim()) {
            tempErrors.email = "Email address is required.";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            tempErrors.email = "Please enter a valid email address.";
            isValid = false;
        }

        if (!message.trim()) {
            tempErrors.message = "Message cannot be empty.";
            isValid = false;
        } else if (message.trim().length < 5) {
            tempErrors.message = "Message must be at least 5 characters.";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBackendError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const API_URL =
                import.meta.env.MODE === "development"
                    ? "http://localhost:3000"
                    : "https://she-can-foundation-l03c.onrender.com";

            const response = await fetch(`${API_URL}/api/submissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            });

            const result = await response.json();

            if (response.ok) {
                setSubmitSuccess(true);
                // Reset form
                setName("");
                setEmail("");
                setMessage("");
                onFormSubmitted(); // trigger list update in Admin if active
            } else {
                setBackendError(
                    result.error ||
                        "Something went wrong. Please check your fields and try again.",
                );
            }
        } catch (err) {
            setBackendError(
                "Could not reach back-end server. Working offline or dev server starting up. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            id="contact"
            className="mx-auto w-full bg-nat-bg transition-colors"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
                {/* Left column: Hero Information & Pillar Showcase */}
                <div className="lg:col-span-5 bg-nat-light-card p-8 md:p-16 flex flex-col justify-center border-r border-nat-border text-left relative overflow-hidden">
                    {/* Subtle nature circle art */}
                    <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-nat-sage/10 blur-xl"></div>
                    <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-nat-terracotta/15 blur-2xl"></div>

                    <div className="relative z-10 space-y-6">
                        <span className="text-nat-sage font-bold uppercase tracking-widest text-xs">
                            Internship Program 2026
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-nat-heading leading-tight tracking-tight">
                            Empowering <br />
                            <span className="italic text-nat-terracotta">
                                Innovation
                            </span>{" "}
                            & <br />
                            Leadership.
                        </h1>

                        <p className="text-base text-nat-desc leading-relaxed max-w-md">
                            Join our Full Stack Development Internship. She Can
                            Foundation provides the tools, community, and expert
                            support for women to thrive in the world of modern
                            software engineering.
                        </p>

                        {/* Avatars pile indicator */}
                        <div className="flex items-center space-x-4 pt-4 border-t border-nat-border/50">
                            <div className="flex -space-x-2">
                                <div className="w-10 h-10 rounded-full border-2 border-nat-light-card bg-[#8B9D8B] text-white flex items-center justify-center font-bold text-xs select-none">
                                    A
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-nat-light-card bg-[#D99175] text-white flex items-center justify-center font-bold text-xs select-none">
                                    M
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-nat-light-card bg-[#C4C0BB] text-white flex items-center justify-center font-bold text-xs select-none">
                                    S
                                </div>
                            </div>
                            <span className="text-xs text-nat-muted font-semibold tracking-wide">
                                Joined by 400+ aspirants this semester
                            </span>
                        </div>

                        {/* Core Tracks/Initiatives lists */}
                        <div id="initiatives" className="space-y-4 pt-6">
                            <h3 className="font-serif text-lg font-bold text-nat-heading">
                                Our Key Pillars
                            </h3>

                            <div className="flex items-start space-x-3 rounded-2xl bg-white/60 p-4 border border-nat-border/60 shadow-sm">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nat-sage/20 text-[#6B7D6B]">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-sans font-bold text-nat-heading text-xs uppercase tracking-wider">
                                        Digital Scholars Academy
                                    </h4>
                                    <p className="mt-1 font-sans text-xs text-nat-desc">
                                        Providing fully accredited training
                                        scholarships in backend server stacks
                                        and TypeScript databases.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 rounded-2xl bg-white/60 p-4 border border-nat-border/60 shadow-sm">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nat-terracotta/20 text-[#B97155]">
                                    <Award className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-sans font-bold text-nat-heading text-xs uppercase tracking-wider">
                                        Direct Mentorship
                                    </h4>
                                    <p className="mt-1 font-sans text-xs text-nat-desc">
                                        Paired directly with senior architects
                                        and developers using modern database
                                        systems.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center text-xs font-semibold text-nat-muted gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-nat-sage animate-pulse"></span>
                            <span>
                                Backend status:{" "}
                                <span className="text-nat-heading">
                                    {apiStatus ||
                                        "Self-healing system connection"}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right column: The Contact Form Card Area */}
                <div className="lg:col-span-7 bg-white p-8 md:p-16 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto">
                        <AnimatePresence mode="wait">
                            {!submitSuccess ? (
                                <motion.div
                                    key="form-view"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-8 text-left">
                                        <h2 className="text-2xl font-serif text-nat-heading mb-2">
                                            Submit Your Inquiry
                                        </h2>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-nat-muted">
                                            Start your journey with She Can
                                            Foundation
                                        </p>
                                    </div>

                                    {backendError && (
                                        <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-100">
                                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                                            <p className="text-left font-medium">
                                                {backendError}
                                            </p>
                                        </div>
                                    )}

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-5 text-left"
                                    >
                                        {/* Name field */}
                                        <div>
                                            <label
                                                htmlFor="name"
                                                className="block text-xs font-bold uppercase tracking-widest text-nat-muted mb-2"
                                            >
                                                Full Name{" "}
                                                <span className="text-nat-terracotta">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (errors.name)
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            name: undefined,
                                                        }));
                                                }}
                                                placeholder="e.g. Jane Doe"
                                                className={`w-full px-4 py-3 rounded-xl bg-nat-bg border text-sm focus:outline-none focus:ring-2 focus:ring-nat-sage/20 placeholder:text-nat-placeholder text-nat-heading transition-shadow ${
                                                    errors.name
                                                        ? "border-rose-350 focus:border-rose-400"
                                                        : "border-nat-border focus:border-nat-sage"
                                                }`}
                                            />
                                            {errors.name && (
                                                <p
                                                    id="name-error"
                                                    className="mt-1.5 flex items-center gap-1 font-sans text-[11px] text-rose-500 font-semibold"
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email field */}
                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="block text-xs font-bold uppercase tracking-widest text-nat-muted mb-2"
                                            >
                                                Email Address{" "}
                                                <span className="text-nat-terracotta">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email)
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            email: undefined,
                                                        }));
                                                }}
                                                placeholder="jane@example.com"
                                                className={`w-full px-4 py-3 rounded-xl bg-nat-bg border text-sm focus:outline-none focus:ring-2 focus:ring-nat-sage/20 placeholder:text-nat-placeholder text-nat-heading transition-shadow ${
                                                    errors.email
                                                        ? "border-rose-350 focus:border-rose-400"
                                                        : "border-nat-border focus:border-nat-sage"
                                                }`}
                                            />
                                            {errors.email && (
                                                <p
                                                    id="email-error"
                                                    className="mt-1.5 flex items-center gap-1 font-sans text-[11px] text-rose-500 font-semibold"
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* Message field */}
                                        <div>
                                            <label
                                                htmlFor="message"
                                                className="block text-xs font-bold uppercase tracking-widest text-nat-muted mb-2"
                                            >
                                                Message / Motivation{" "}
                                                <span className="text-nat-terracotta">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows={4}
                                                required
                                                value={message}
                                                onChange={(e) => {
                                                    setMessage(e.target.value);
                                                    if (errors.message)
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            message: undefined,
                                                        }));
                                                }}
                                                placeholder="Why would you like to join the She Can Foundation?"
                                                className={`w-full px-4 py-3 rounded-xl bg-nat-bg border text-sm focus:outline-none focus:ring-2 focus:ring-nat-sage/20 placeholder:text-nat-placeholder text-nat-heading resize-none min-h-[110px] transition-shadow ${
                                                    errors.message
                                                        ? "border-rose-350 focus:border-rose-400"
                                                        : "border-nat-border focus:border-nat-sage"
                                                }`}
                                            ></textarea>
                                            {errors.message && (
                                                <p
                                                    id="message-error"
                                                    className="mt-1.5 flex items-center gap-1 font-sans text-[11px] text-rose-500 font-semibold"
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#8B9D8B] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8B9D8B]/20 hover:bg-[#7A8C7A] transition-all uppercase tracking-widest text-xs cursor-pointer active:scale-99 disabled:opacity-75"
                                        >
                                            <span className="flex items-center justify-center space-x-2">
                                                {isSubmitting ? (
                                                    <>
                                                        <svg
                                                            className="h-4 w-4 animate-spin text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        <span>
                                                            Submitting
                                                            securely...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-3 w-3" />
                                                        <span>
                                                            Submit Application
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                        </button>

                                        <p className="text-center font-sans text-[11px] text-nat-muted">
                                            Protected by real-time data
                                            integrations. Submissions are
                                            instantly persistent.
                                        </p>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success-view"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 20,
                                    }}
                                    className="flex flex-col items-center justify-center py-8 text-center"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F1] text-nat-sage mb-6 border border-nat-sage/30 shadow-sm">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>

                                    <h2 className="font-serif text-3xl font-extrabold text-nat-heading">
                                        Form Submitted Successfully
                                    </h2>

                                    <p className="mt-3 font-sans text-xs text-nat-desc max-w-sm mx-auto leading-relaxed">
                                        Thank you immensely for your
                                        participation! Your credentials have
                                        been secured in our dynamic database.
                                        The recruitment committee will
                                        correspond at their earliest
                                        convenience.
                                    </p>

                                    <div className="mt-6 p-4 rounded-xl bg-nat-bg border border-nat-border w-full text-left">
                                        <div className="font-sans font-bold text-nat-heading text-[10px] uppercase tracking-wider mb-2">
                                            Submission Context
                                        </div>
                                        <div className="font-sans text-[11px] text-nat-muted space-y-1">
                                            <div>
                                                <strong>Active Engine:</strong>{" "}
                                                {apiStatus ||
                                                    "Persistent JSON File Storage"}
                                            </div>
                                            <div>
                                                <strong>Receipt Tag:</strong>{" "}
                                                SECURE_ENTRY_SIGNED
                                            </div>
                                            <div>
                                                <strong>Timestamp:</strong>{" "}
                                                {new Date().toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSubmitSuccess(false)}
                                        className="mt-6 rounded-xl border border-nat-border bg-white px-5 py-2.5 font-sans text-xs font-bold text-nat-desc shadow-sm transition-all hover:bg-nat-light-card cursor-pointer"
                                    >
                                        Submit Another Application
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
