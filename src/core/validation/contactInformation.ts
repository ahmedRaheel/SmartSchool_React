export const contactPatterns = {
    cnic: /^\d{5}-\d{7}-\d$/,
    telephone: /^\(\d{2}\)-\(\d{3}\)-\(\d{8}\)$/,
    mobile: /^\(\d{2}\)-\(\d{4}\)-\(\d{7}\)$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const contactExamples = {
    cnic: "12345-1234567-1",
    telephone: "(21)-(123)-(12345678)",
    mobile: "(92)-(3000)-(1234567)",
    email: "name@example.com",
} as const;

type ContactKind = keyof typeof contactPatterns;

export function getContactKind(fieldName: string): ContactKind | null {
    const normalizedName = fieldName.replace(/[^a-zA-Z]/g, "").toLowerCase();

    if (normalizedName.includes("email")) {
        return "email";
    }

    if (normalizedName.includes("cnic")) {
        return "cnic";
    }

    if (
        normalizedName.includes("telephone")
        || normalizedName.includes("landline")
        || normalizedName.includes("fax")
    ) {
        return "telephone";
    }

    if (normalizedName.includes("mobile") || normalizedName.includes("phone")) {
        return "mobile";
    }

    return null;
}

export function validateContactValue(kind: ContactKind, value: string): boolean {
    if (!value.trim()) {
        return true;
    }

    return contactPatterns[kind].test(value.trim());
}

export function formatCnic(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean);
    return parts.join("-");
}

export function formatTelephone(value: string): string {
    return formatGroupedPhone(value, [2, 3, 8]);
}

export function formatMobile(value: string): string {
    return formatGroupedPhone(value, [2, 4, 7]);
}

function formatGroupedPhone(value: string, groupSizes: number[]): string {
    const maximumLength = groupSizes.reduce((total, size) => total + size, 0);
    const digits = value.replace(/\D/g, "").slice(0, maximumLength);
    const groups: string[] = [];
    let offset = 0;

    for (const size of groupSizes) {
        const group = digits.slice(offset, offset + size);
        if (group) {
            groups.push(`(${group})`);
        }
        offset += size;
    }

    return groups.join("-");
}

export function installContactInputRules(): void {
    document.addEventListener("input", handleInput, true);
    document.addEventListener("blur", handleBlur, true);
}

function handleInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    const kind = resolveInputKind(input);
    if (!kind) {
        return;
    }

    if (kind === "cnic") {
        input.value = formatCnic(input.value);
    } else if (kind === "telephone") {
        input.value = formatTelephone(input.value);
    } else if (kind === "mobile") {
        input.value = formatMobile(input.value);
    }

    applyInputMetadata(input, kind);
}

function handleBlur(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    const kind = resolveInputKind(input);
    if (!kind) {
        return;
    }

    applyInputMetadata(input, kind);

    const valid = validateContactValue(kind, input.value);
    input.setCustomValidity(valid ? "" : validationMessage(kind));
}

function resolveInputKind(input: HTMLInputElement): ContactKind | null {
    if (input.type === "email") {
        return "email";
    }

    const candidates = [input.name, input.id, input.placeholder, input.getAttribute("aria-label") ?? ""];

    for (const candidate of candidates) {
        const kind = getContactKind(candidate);
        if (kind) {
            return kind;
        }
    }

    return null;
}

function applyInputMetadata(input: HTMLInputElement, kind: ContactKind): void {
    if (!input.placeholder) {
        input.placeholder = contactExamples[kind];
    }

    input.setAttribute("data-contact-format", kind);

    if (kind === "email") {
        input.type = "email";
        return;
    }

    input.inputMode = "numeric";
}

function validationMessage(kind: ContactKind): string {
    switch (kind) {
        case "cnic":
            return `CNIC must use the format ${contactExamples.cnic}.`;
        case "telephone":
            return `Telephone must use the format ${contactExamples.telephone}.`;
        case "mobile":
            return `Mobile must use the format ${contactExamples.mobile}.`;
        case "email":
            return `Enter a valid email address, for example ${contactExamples.email}.`;
    }
}

export function validateContactPayload(payload: unknown): void {
    validatePayloadValue(payload, "request");
}

function validatePayloadValue(value: unknown, path: string): void {
    if (Array.isArray(value)) {
        value.forEach((item, index) => validatePayloadValue(item, `${path}[${index}]`));
        return;
    }

    if (!value || typeof value !== "object" || value instanceof FormData) {
        return;
    }

    for (const [key, fieldValue] of Object.entries(value as Record<string, unknown>)) {
        const fieldPath = `${path}.${key}`;
        const kind = getContactKind(key);

        if (kind && typeof fieldValue === "string" && !validateContactValue(kind, fieldValue)) {
            throw new Error(`${fieldPath}: ${validationMessage(kind)}`);
        }

        validatePayloadValue(fieldValue, fieldPath);
    }
}
