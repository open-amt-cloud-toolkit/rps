/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const passwordLengthValidation = (value: string): boolean => value.length >= 8 && value.length <= 32

export const passwordValidation = (value: string): boolean =>
  /^(?=.*[0-9])(?=.*[!@#$%^*])(?=.*[a-z])(?=.*[A-Z])[-a-zA-Z0-9$@$!%*#?_~^]{8,32}$/.test(value)
