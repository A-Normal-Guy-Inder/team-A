import React, { memo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({ name, placeholder, value, onChange, onEnter, autoComplete = "off" }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-field">
            <input
                type={visible ? "text" : "password"}
                name={name}
                placeholder={placeholder}
                value={value}
                maxLength={100}
                autoComplete={autoComplete}
                onChange={onChange}
                onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
            />
            <button
                type="button"
                className="toggle-password"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((current) => !current)}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default memo(PasswordInput);
