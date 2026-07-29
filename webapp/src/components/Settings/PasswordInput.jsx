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
            <span
                className="toggle-password"
                onClick={() => setVisible((current) => !current)}
                style={{ cursor: "pointer" }}
            >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
        </div>
    );
};

export default memo(PasswordInput);
