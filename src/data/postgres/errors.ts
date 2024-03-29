/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const enum PostgresErr {
  // Class 00 — Successful Completion
  C00_SUCCESSFUL_COMPLETION = '00000',
  // Class 01 — Warning
  C01_WARNING = '01000',
  C01_DYNAMIC_RESULT_SETS_RETURNED = '0100C',
  C01_IMPLICIT_ZERO_BIT_PADDING = '01008',
  C01_NULL_VALUE_ELIMINATED_IN_SET_FUNCTION = '01003',
  C01_PRIVILEGE_NOT_GRANTED = '01007',
  C01_PRIVILEGE_NOT_REVOKED = '01006',
  C01_STRING_DATA_RIGHT_TRUNCATION = '01004',
  C01_DEPRECATED_FEATURE = '01P01',
  // Class 02 — No Data (this is also a warning class per the SQL standard)
  C02_NO_DATA = '02000',
  C02_NO_ADDITIONAL_DYNAMIC_RESULT_SETS_RETURNED = '02001',
  // Class 03 — SQL Statement Not Yet Complete
  C03_SQL_STATEMENT_NOT_YET_COMPLETE = '03000',
  // Class 08 — Connection Exception
  C08_CONNECTION_EXCEPTION = '08000',
  C08_CONNECTION_DOES_NOT_EXIST = '08003',
  C08_CONNECTION_FAILURE = '08006',
  C08_SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION = '08001',
  C08_SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION = '08004',
  C08_TRANSACTION_RESOLUTION_UNKNOWN = '08007',
  C08_PROTOCOL_VIOLATION = '08P01',
  // Class 09 — Triggered Action Exception
  C09_TRIGGERED_ACTION_EXCEPTION = '09000',
  // Class 0A — Feature Not Supported
  C0A_FEATURE_NOT_SUPPORTED = '0A000',
  // Class 0B — Invalid Transaction Initiation
  C0B_INVALID_TRANSACTION_INITIATION = '0B000',
  // Class 0F — Locator Exception
  C0F_LOCATOR_EXCEPTION = '0F000',
  C0F_INVALID_LOCATOR_SPECIFICATION = '0F001',
  // Class 0L — Invalid Grantor
  C0L_INVALID_GRANTOR = '0L000',
  C0L_INVALID_GRANT_OPERATION = '0LP01',
  // Class 0P — Invalid Role Specification
  C0P_INVALID_ROLE_SPECIFICATION = '0P000',
  // Class 0Z — Diagnostics Exception
  C0Z_DIAGNOSTICS_EXCEPTION = '0Z000',
  C0Z_STACKED_DIAGNOSTICS_ACCESSED_WITHOUT_ACTIVE_HANDLER = '0Z002',
  // Class 20 — Case Not Found
  C20_CASE_NOT_FOUND = '20000',
  // Class 21 — Cardinality Violation
  C21_CARDINALITY_VIOLATION = '21000',
  // Class 22 — Data Exception
  C22_DATA_EXCEPTION = '22000',
  C22_ARRAY_SUBSCRIPT_ERROR = '2202E',
  C22_CHARACTER_NOT_IN_REPERTOIRE = '22021',
  C22_DATETIME_FIELD_OVERFLOW = '22008',
  C22_DIVISION_BY_ZERO = '22012',
  C22_ERROR_IN_ASSIGNMENT = '22005',
  C22_ESCAPE_CHARACTER_CONFLICT = '2200B',
  C22_INDICATOR_OVERFLOW = '22022',
  C22_INTERVAL_FIELD_OVERFLOW = '22015',
  C22_INVALID_ARGUMENT_FOR_LOGARITHM = '2201E',
  C22_INVALID_ARGUMENT_FOR_NTILE_FUNCTION = '22014',
  C22_INVALID_ARGUMENT_FOR_NTH_VALUE_FUNCTION = '22016',
  C22_INVALID_ARGUMENT_FOR_POWER_FUNCTION = '2201F',
  C22_INVALID_ARGUMENT_FOR_WIDTH_BUCKET_FUNCTION = '2201G',
  C22_INVALID_CHARACTER_VALUE_FOR_CAST = '22018',
  C22_INVALID_DATETIME_FORMAT = '22007',
  C22_INVALID_ESCAPE_CHARACTER = '22019',
  C22_INVALID_ESCAPE_OCTET = '2200D',
  C22_INVALID_ESCAPE_SEQUENCE = '22025',
  C22_NONSTANDARD_USE_OF_ESCAPE_CHARACTER = '22P06',
  C22_INVALID_INDICATOR_PARAMETER_VALUE = '22010',
  C22_INVALID_PARAMETER_VALUE = '22023',
  C22_INVALID_PRECEDING_OR_FOLLOWING_SIZE = '22013',
  C22_INVALID_REGULAR_EXPRESSION = '2201B',
  C22_INVALID_ROW_COUNT_IN_LIMIT_CLAUSE = '2201W',
  C22_INVALID_ROW_COUNT_IN_RESULT_OFFSET_CLAUSE = '2201X',
  C22_INVALID_TABLESAMPLE_ARGUMENT = '2202H',
  C22_INVALID_TABLESAMPLE_REPEAT = '2202G',
  C22_INVALID_TIME_ZONE_DISPLACEMENT_VALUE = '22009',
  C22_INVALID_USE_OF_ESCAPE_CHARACTER = '2200C',
  C22_MOST_SPECIFIC_TYPE_MISMATCH = '2200G',
  C22_NULL_VALUE_NOT_ALLOWED = '22004',
  C22_NULL_VALUE_NO_INDICATOR_PARAMETER = '22002',
  C22_NUMERIC_VALUE_OUT_OF_RANGE = '22003',
  C22_SEQUENCE_GENERATOR_LIMIT_EXCEEDED = '2200H',
  C22_STRING_DATA_LENGTH_MISMATCH = '22026',
  C22_STRING_DATA_RIGHT_TRUNCATION = '22001',
  C22_SUBSTRING_ERROR = '22011',
  C22_TRIM_ERROR = '22027',
  C22_UNTERMINATED_C_STRING = '22024',
  C22_ZERO_LENGTH_CHARACTER_STRING = '2200F',
  C22_FLOATING_POINT_EXCEPTION = '22P01',
  C22_INVALID_TEXT_REPRESENTATION = '22P02',
  C22_INVALID_BINARY_REPRESENTATION = '22P03',
  C22_BAD_COPY_FILE_FORMAT = '22P04',
  C22_UNTRANSLATABLE_CHARACTER = '22P05',
  C22_NOT_AN_XML_DOCUMENT = '2200L',
  C22_INVALID_XML_DOCUMENT = '2200M',
  C22_INVALID_XML_CONTENT = '2200N',
  C22_INVALID_XML_COMMENT = '2200S',
  C22_INVALID_XML_PROCESSING_INSTRUCTION = '2200T',
  C22_DUPLICATE_JSON_OBJECT_KEY_VALUE = '22030',
  C22_INVALID_ARGUMENT_FOR_SQL_JSON_DATETIME_FUNCTION = '22031',
  C22_INVALID_JSON_TEXT = '22032',
  C22_INVALID_SQL_JSON_SUBSCRIPT = '22033',
  C22_MORE_THAN_ONE_SQL_JSON_ITEM = '22034',
  C22_NO_SQL_JSON_ITEM = '22035',
  C22_NON_NUMERIC_SQL_JSON_ITEM = '22036',
  C22_NON_UNIQUE_KEYS_IN_A_JSON_OBJECT = '22037',
  C22_SINGLETON_SQL_JSON_ITEM_REQUIRED = '22038',
  C22_SQL_JSON_ARRAY_NOT_FOUND = '22039',
  C22_SQL_JSON_MEMBER_NOT_FOUND = '2203A',
  C22_SQL_JSON_NUMBER_NOT_FOUND = '2203B',
  C22_SQL_JSON_OBJECT_NOT_FOUND = '2203C',
  C22_TOO_MANY_JSON_ARRAY_ELEMENTS = '2203D',
  C22_TOO_MANY_JSON_OBJECT_MEMBERS = '2203E',
  C22_SQL_JSON_SCALAR_REQUIRED = '2203F',
  C22_SQL_JSON_ITEM_CANNOT_BE_CAST_TO_TARGET_TYPE = '2203G',
  // Class 23 — Integrity Constraint Violation
  C23_INTEGRITY_CONSTRAINT_VIOLATION = '23000',
  C23_RESTRICT_VIOLATION = '23001',
  C23_NOT_NULL_VIOLATION = '23502',
  C23_FOREIGN_KEY_VIOLATION = '23503',
  C23_UNIQUE_VIOLATION = '23505',
  C23_CHECK_VIOLATION = '23514',
  C23_EXCLUSION_VIOLATION = '23P01',
  // Class 24 — Invalid Cursor State
  C24_INVALID_CURSOR_STATE = '24000',
  // Class 25 — Invalid Transaction State,
  C25_INVALID_TRANSACTION_STATE = '25000',
  C25_ACTIVE_SQL_TRANSACTION = '25001',
  C25_BRANCH_TRANSACTION_ALREADY_ACTIVE = '25002',
  C25_HELD_CURSOR_REQUIRES_SAME_ISOLATION_LEVEL = '25008',
  C25_INAPPROPRIATE_ACCESS_MODE_FOR_BRANCH_TRANSACTION = '25003',
  C25_INAPPROPRIATE_ISOLATION_LEVEL_FOR_BRANCH_TRANSACTION = '25004',
  C25_NO_ACTIVE_SQL_TRANSACTION_FOR_BRANCH_TRANSACTION = '25005',
  C25_READ_ONLY_SQL_TRANSACTION = '25006',
  C25_SCHEMA_AND_DATA_STATEMENT_MIXING_NOT_SUPPORTED = '25007',
  C25_NO_ACTIVE_SQL_TRANSACTION = '25P01',
  C25_IN_FAILED_SQL_TRANSACTION = '25P02',
  C25_IDLE_IN_TRANSACTION_SESSION_TIMEOUT = '25P03',
  // Class 26 — Invalid SQL Statement Name
  C26_INVALID_SQL_STATEMENT_NAME = '26000',
  // Class 27 — Triggered Data Change Violation
  C27_TRIGGERED_DATA_CHANGE_VIOLATION = '27000',
  // Class 28 — Invalid Authorization Specification
  C28_INVALID_AUTHORIZATION_SPECIFICATION = '28000',
  C28_INVALID_PASSWORD = '28P01',
  // Class 2B — Dependent Privilege Descriptors Still Exist
  C2B_DEPENDENT_PRIVILEGE_DESCRIPTORS_STILL_EXIST = '2B000',
  C2B_DEPENDENT_OBJECTS_STILL_EXIST = '2BP01',
  // Class 2D — Invalid Transaction Termination
  C2D_INVALID_TRANSACTION_TERMINATION = '2D000',
  // Class 2F — SQL Routine Exception
  C2F_SQL_ROUTINE_EXCEPTION = '2F000',
  C2F_FUNCTION_EXECUTED_NO_RETURN_STATEMENT = '2F005',
  C2F_MODIFYING_SQL_DATA_NOT_PERMITTED = '2F002',
  C2F_PROHIBITED_SQL_STATEMENT_ATTEMPTED = '2F003',
  C2F_READING_SQL_DATA_NOT_PERMITTED = '2F004',
  // Class 34 — Invalid Cursor Name
  C34_INVALID_CURSOR_NAME = '34000',
  // Class 38 — External Routine Exception
  C38_EXTERNAL_ROUTINE_EXCEPTION = '38000',
  C38_CONTAINING_SQL_NOT_PERMITTED = '38001',
  C38_MODIFYING_SQL_DATA_NOT_PERMITTED = '38002',
  C38_PROHIBITED_SQL_STATEMENT_ATTEMPTED = '38003',
  C38_READING_SQL_DATA_NOT_PERMITTED = '38004',
  // Class 39 — External Routine Invocation Exception
  C39_EXTERNAL_ROUTINE_INVOCATION_EXCEPTION = '39000',
  C39_INVALID_SQLSTATE_RETURNED = '39001',
  C39_NULL_VALUE_NOT_ALLOWED = '39004',
  C39_TRIGGER_PROTOCOL_VIOLATED = '39P01',
  C39_SRF_PROTOCOL_VIOLATED = '39P02',
  C39_EVENT_TRIGGER_PROTOCOL_VIOLATED = '39P03',
  // Class 3B — Savepoint Exception
  C3B_SAVEPOINT_EXCEPTION = '3B000',
  C3B_INVALID_SAVEPOINT_SPECIFICATION = '3B001',
  // Class 3D — Invalid Catalog Name
  C3D_INVALID_CATALOG_NAME = '3D000',
  // Class 3F — Invalid Schema Name
  C3F_INVALID_SCHEMA_NAME = '3F000',
  // Class 40 — Transaction Rollback
  C40_TRANSACTION_ROLLBACK = '40000',
  C40_TRANSACTION_INTEGRITY_CONSTRAINT_VIOLATION = '40002',
  C40_SERIALIZATION_FAILURE = '40001',
  C40_STATEMENT_COMPLETION_UNKNOWN = '40003',
  C40_DEADLOCK_DETECTED = '40P01',
  // Class 42 — Syntax Error or Access Rule Violation
  C42_SYNTAX_ERROR_OR_ACCESS_RULE_VIOLATION = '42000',
  C42_SYNTAX_ERROR = '42601',
  C42_INSUFFICIENT_PRIVILEGE = '42501',
  C42_CANNOT_COERCE = '42846',
  C42_GROUPING_ERROR = '42803',
  C42_WINDOWING_ERROR = '42P20',
  C42_INVALID_RECURSION = '42P19',
  C42_INVALID_FOREIGN_KEY = '42830',
  C42_INVALID_NAME = '42602',
  C42_NAME_TOO_LONG = '42622',
  C42_RESERVED_NAME = '42939',
  C42_DATATYPE_MISMATCH = '42804',
  C42_INDETERMINATE_DATATYPE = '42P18',
  C42_COLLATION_MISMATCH = '42P21',
  C42_INDETERMINATE_COLLATION = '42P22',
  C42_WRONG_OBJECT_TYPE = '42809',
  C42_GENERATED_ALWAYS = '428C9',
  C42_UNDEFINED_COLUMN = '42703',
  C42_UNDEFINED_FUNCTION = '42883',
  C42_UNDEFINED_TABLE = '42P01',
  C42_UNDEFINED_PARAMETER = '42P02',
  C42_UNDEFINED_OBJECT = '42704',
  C42_DUPLICATE_COLUMN = '42701',
  C42_DUPLICATE_CURSOR = '42P03',
  C42_DUPLICATE_DATABASE = '42P04',
  C42_DUPLICATE_FUNCTION = '42723',
  C42_DUPLICATE_PREPARED_STATEMENT = '42P05',
  C42_DUPLICATE_SCHEMA = '42P06',
  C42_DUPLICATE_TABLE = '42P07',
  C42_DUPLICATE_ALIAS = '42712',
  C42_DUPLICATE_OBJECT = '42710',
  C42_AMBIGUOUS_COLUMN = '42702',
  C42_AMBIGUOUS_FUNCTION = '42725',
  C42_AMBIGUOUS_PARAMETER = '42P08',
  C42_AMBIGUOUS_ALIAS = '42P09',
  C42_INVALID_COLUMN_REFERENCE = '42P10',
  C42_INVALID_COLUMN_DEFINITION = '42611',
  C42_INVALID_CURSOR_DEFINITION = '42P11',
  C42_INVALID_DATABASE_DEFINITION = '42P12',
  C42_INVALID_FUNCTION_DEFINITION = '42P13',
  C42_INVALID_PREPARED_STATEMENT_DEFINITION = '42P14',
  C42_INVALID_SCHEMA_DEFINITION = '42P15',
  C42_INVALID_TABLE_DEFINITION = '42P16',
  C42_INVALID_OBJECT_DEFINITION = '42P17',
  // Class 44 — WITH CHECK OPTION Violation
  C44_WITH_CHECK_OPTION_VIOLATION = '44000',
  // Class 53 — Insufficient Resources
  C53_INSUFFICIENT_RESOURCES = '53000',
  C53_DISK_FULL = '53100',
  C53_OUT_OF_MEMORY = '53200',
  C53_TOO_MANY_CONNECTIONS = '53300',
  C53_CONFIGURATION_LIMIT_EXCEEDED = '53400',
  // Class 54 — Program Limit Exceeded
  C54_PROGRAM_LIMIT_EXCEEDED = '54000',
  C54_STATEMENT_TOO_COMPLEX = '54001',
  C54_TOO_MANY_COLUMNS = '54011',
  C54_TOO_MANY_ARGUMENTS = '54023',
  // Class 55 — Object Not In Prerequisite State
  C55_OBJECT_NOT_IN_PREREQUISITE_STATE = '55000',
  C55_OBJECT_IN_USE = '55006',
  C55_CANT_CHANGE_RUNTIME_PARAM = '55P02',
  C55_LOCK_NOT_AVAILABLE = '55P03',
  C55_UNSAFE_NEW_ENUM_VALUE_USAGE = '55P04',
  // Class 57 — Operator Intervention
  C57_OPERATOR_INTERVENTION = '57000',
  C57_QUERY_CANCELED = '57014',
  C57_ADMIN_SHUTDOWN = '57P01',
  C57_CRASH_SHUTDOWN = '57P02',
  C57_CANNOT_CONNECT_NOW = '57P03',
  C57_DATABASE_DROPPED = '57P04',
  C57_IDLE_SESSION_TIMEOUT = '57P05',
  // Class 58 — System Error (errors external to PostgreSQL itself)
  C58_SYSTEM_ERROR = '58000',
  C58_IO_ERROR = '58030',
  C58_UNDEFINED_FILE = '58P01',
  C58_DUPLICATE_FILE = '58P02',
  // Class 72 — Snapshot Failure
  C72_SNAPSHOT_TOO_OLD = '72000',
  // Class F0 — Configuration File Error
  CF0_CONFIG_FILE_ERROR = 'F0000',
  CF0_LOCK_FILE_EXISTS = 'F0001',
  // Class HV — Foreign Data Wrapper Error (SQL/MED)
  CHV_FDW_ERROR = 'HV000',
  CHV_FDW_COLUMN_NAME_NOT_FOUND = 'HV005',
  CHV_FDW_DYNAMIC_PARAMETER_VALUE_NEEDED = 'HV002',
  CHV_FDW_FUNCTION_SEQUENCE_ERROR = 'HV010',
  CHV_FDW_INCONSISTENT_DESCRIPTOR_INFORMATION = 'HV021',
  CHV_FDW_INVALID_ATTRIBUTE_VALUE = 'HV024',
  CHV_FDW_INVALID_COLUMN_NAME = 'HV007',
  CHV_FDW_INVALID_COLUMN_NUMBER = 'HV008',
  CHV_FDW_INVALID_DATA_TYPE = 'HV004',
  CHV_FDW_INVALID_DATA_TYPE_DESCRIPTORS = 'HV006',
  CHV_FDW_INVALID_DESCRIPTOR_FIELD_IDENTIFIER = 'HV091',
  CHV_FDW_INVALID_HANDLE = 'HV00B',
  CHV_FDW_INVALID_OPTION_INDEX = 'HV00C',
  CHV_FDW_INVALID_OPTION_NAME = 'HV00D',
  CHV_FDW_INVALID_STRING_LENGTH_OR_BUFFER_LENGTH = 'HV090',
  CHV_FDW_INVALID_STRING_FORMAT = 'HV00A',
  CHV_FDW_INVALID_USE_OF_NULL_POINTER = 'HV009',
  CHV_FDW_TOO_MANY_HANDLES = 'HV014',
  CHV_FDW_OUT_OF_MEMORY = 'HV001',
  CHV_FDW_NO_SCHEMAS = 'HV00P',
  CHV_FDW_OPTION_NAME_NOT_FOUND = 'HV00J',
  CHV_FDW_REPLY_HANDLE = 'HV00K',
  CHV_FDW_SCHEMA_NOT_FOUND = 'HV00Q',
  CHV_FDW_TABLE_NOT_FOUND = 'HV00R',
  CHV_FDW_UNABLE_TO_CREATE_EXECUTION = 'HV00L',
  CHV_FDW_UNABLE_TO_CREATE_REPLY = 'HV00M',
  CHV_FDW_UNABLE_TO_ESTABLISH_CONNECTION = 'HV00N',
  // Class P0 — PL/pgSQL Error
  CP0_PLPGSQL_ERROR = 'P0000',
  CP0_RAISE_EXCEPTION = 'P0001',
  CP0_NO_DATA_FOUND = 'P0002',
  CP0_TOO_MANY_ROWS = 'P0003',
  CP0_ASSERT_FAILURE = 'P0004',
  // Class XX — Internal Error
  CXX_INTERNAL_ERROR = 'XX000',
  CXX_DATA_CORRUPTED = 'XX001',
  CXX_INDEX_CORRUPTED = 'XX002'
}
