/**
 * Converts an ISO timestamp into the `YYYY-MM-DDTHH:mm` string that
 * `<input type="datetime-local">` expects.
 *
 * Slicing the ISO string directly (the previous approach) feeds a **UTC** value
 * into a control that interprets it as local time, so opening the edit form
 * silently shifted every time by the timezone offset.
 */
export function toDateTimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
}

/** Local `datetime-local` string → ISO, so the server always receives an absolute instant. */
export function fromDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Minimum accepted by the date pickers: now, rounded to the minute. */
export function nowForInput() {
    return toDateTimeLocal(new Date());
}
