"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
    undefined
);

const useSelectContext = () => {
    const context = React.useContext(SelectContext);
    if (!context) {
        throw new Error("Select components must be used within a Select");
    }
    return context;
};

interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const Select = ({ value = "", onValueChange, disabled, children }: SelectProps) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value);

    const handleValueChange = (newValue: string) => {
        setInternalValue(newValue);
        onValueChange?.(newValue);
        setOpen(false);
    };

    return (
        <SelectContext.Provider
            value={{
                value: internalValue,
                onValueChange: handleValueChange,
                open: !disabled && open,
                setOpen: disabled ? () => { } : setOpen,
            }}
        >
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext();

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            onClick={() => setOpen(!open)}
            {...props}
        >
            {children}
            <svg
                className={cn(
                    "h-4 w-4 opacity-50 transition-transform",
                    open && "rotate-180"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { value } = useSelectContext();
    return <span>{value || placeholder}</span>;
};

const SelectContent = ({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = useSelectContext();

    if (!open) return null;

    return (
        <div
            className={cn(
                "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const SelectItem = ({
    className,
    children,
    value,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
    const { onValueChange, value: selectedValue } = useSelectContext();

    return (
        <div
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
                selectedValue === value && "bg-gray-100 font-medium",
                className
            )}
            onClick={() => onValueChange(value)}
            {...props}
        >
            {children}
        </div>
    );
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
