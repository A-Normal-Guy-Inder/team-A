import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../../services/api";
import { patchUser, selectCurrentUser } from "../../features/auth/authSlice";
import { isValidPhone } from "../../utils/validation";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const UpdateProfile = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectCurrentUser);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        profile_picture: null,
        preview: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        setForm({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email_id || "",
            phone_number: user.phone_number || "",
            profile_picture: null,
            preview: user.profile_picture || "",
        });
    }, [user]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.warn("Please choose an image file");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            toast.warn("Image is too large. Maximum size is 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setForm((prev) => ({ ...prev, profile_picture: file, preview: reader.result }));
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSave = useCallback(async () => {
        if (!form.first_name.trim() || !form.last_name.trim()) {
            toast.error("First and last name are required");
            return;
        }
        if (!isValidPhone(form.phone_number)) {
            toast.error("Enter a valid 10-digit phone number");
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();
            formData.append("first_name", form.first_name.trim());
            formData.append("last_name", form.last_name.trim());
            formData.append("phone_number", form.phone_number.trim());
            if (form.profile_picture) formData.append("profile_picture", form.profile_picture);

            const { data } = await api.put("/user/profile", formData);

            if (data?.data?.user) dispatch(patchUser(data.data.user));

            toast.success("Profile updated successfully ⚙️");
        } catch (err) {
            toast.error(getErrorMessage(err, "Profile update failed ❌"));
        } finally {
            setSaving(false);
        }
    }, [dispatch, form]);

    return (
        <>
            <div className="settings-card">
                <h3>Profile Picture</h3>
                <div className="profile-picture-section">
                    <div className="profile-preview">
                        {form.preview ? (
                            <img src={form.preview} alt="profile" />
                        ) : (
                            <div className="profile-placeholder">
                                {form.first_name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
            </div>

            <div className="settings-card">
                <h3>Personal Information</h3>
                <div className="settings-row">
                    <input
                        name="first_name"
                        placeholder="First Name"
                        maxLength={50}
                        value={form.first_name}
                        onChange={handleChange}
                    />
                    <input
                        name="last_name"
                        placeholder="Last Name"
                        maxLength={50}
                        value={form.last_name}
                        onChange={handleChange}
                    />
                </div>
                <input name="email" placeholder="Email" value={form.email} disabled />
                <input
                    name="phone_number"
                    placeholder="Phone Number"
                    maxLength={10}
                    value={form.phone_number}
                    onChange={handleChange}
                />
                <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </>
    );
};

export default UpdateProfile;
