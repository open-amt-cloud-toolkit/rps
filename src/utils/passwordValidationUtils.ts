export const passwordLengthValidation = (value) => value.length >= 8 && value.length <= 32

export const passwordValidation = (value) => /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$/.test(value)
