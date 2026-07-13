type PrimitiveJson = string | number | boolean | null;

export type Json =
	| PrimitiveJson
	| { [key: string]: Json | undefined }
	| Json[];

type UUID = string;
type Timestamp = string;
type DateString = string;
type TimeString = string;
type Money = number;
type Percent = number;
type Nullable<T> = T | null;

type Table<Row extends Record<string, unknown>, Insert extends Record<string, unknown>, Update extends Record<string, unknown>> = {
	Row: Row;
	Insert: Insert;
	Update: Update;
	Relationships: [];
};

export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type EmploymentStatus = 'active' | 'inactive' | 'suspended' | 'resigned';
export type CustomerType = 'individual' | 'business' | 'reseller';
export type ServiceType = 'purchase' | 'pickup' | 'delivery';
export type StaffTaskRevenueType = 'purchase_service' | 'pickup_service' | 'delivery_service' | 'local_delivery_service' | 'handling_service' | 'other_service';
export type FulfillmentMethod = 'branch_pickup' | 'local_delivery';
export type OrderStatus =
	| 'recorded'
	| 'waiting_payment'
	| 'payment_received'
	| 'waiting_origin_process'
	| 'purchasing_or_collecting'
	| 'received_at_origin'
	| 'waiting_departure'
	| 'in_transit'
	| 'arrived_at_destination'
	| 'ready_for_handover'
	| 'completed'
	| 'problem'
	| 'cancelled';
export type OrderItemStatus =
	| 'recorded'
	| 'waiting_confirmation'
	| 'available'
	| 'unavailable'
	| 'purchased'
	| 'collected'
	| 'received_at_origin'
	| 'packed'
	| 'completed'
	| 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type TripStatus = 'draft' | 'preparing' | 'ready_to_depart' | 'in_transit' | 'arrived' | 'completed' | 'cancelled';
export type TaskStatus = 'draft' | 'assigned' | 'started' | 'in_progress' | 'waiting_confirmation' | 'completed' | 'problem' | 'cancelled';
export type HandoverType = 'departure' | 'arrival';
export type AdvanceStatus =
	| 'submitted'
	| 'approved'
	| 'disbursed'
	| 'in_use'
	| 'waiting_settlement'
	| 'settled'
	| 'overdue'
	| 'rejected'
	| 'cancelled';
export type ExpenseApprovalStatus = 'draft' | 'submitted' | 'waiting_verification' | 'approved' | 'rejected' | 'included_in_commission';
export type CommissionPeriodStatus = 'draft' | 'calculated' | 'waiting_approval' | 'approved' | 'locked';
export type PayrollStatus = 'draft' | 'calculated' | 'waiting_approval' | 'approved' | 'paid' | 'locked';
export type PayrollItemType = 'base_salary' | 'vehicle_allowance' | 'communication_allowance' | 'commission' | 'deduction' | 'reimbursement';
export type BranchExpenseStatus = 'draft' | 'waiting_approval' | 'approved' | 'paid' | 'rejected' | 'cancelled';
export type PettyCashTransactionType = 'cash_in' | 'cash_out' | 'advance_return' | 'adjustment';
export type AttachmentEntityType =
	| 'order'
	| 'order_item'
	| 'payment'
	| 'trip'
	| 'trip_handover'
	| 'task'
	| 'operational_advance'
	| 'operational_expense'
	| 'branch_expense'
	| 'rent_contract'
	| 'employee';
export type RevenueStatus = 'pending' | 'eligible' | 'excluded' | 'included_in_commission';

type RoleRow = {
	id: UUID;
	code: string;
	name: string;
	description: Nullable<string>;
	created_at: Timestamp;
};

type PermissionRow = {
	id: UUID;
	code: string;
	module: string;
	name: string;
	description: Nullable<string>;
	created_at: Timestamp;
};

type RolePermissionRow = {
	role_id: UUID;
	permission_id: UUID;
	created_at: Timestamp;
};

type BranchRow = {
	id: UUID;
	code: string;
	name: string;
	city: string;
	address: Nullable<string>;
	whatsapp: Nullable<string>;
	maps_url: Nullable<string>;
	opening_hours: Nullable<string>;
	is_active: boolean;
	head_employee_id: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type ProfileRow = {
	id: UUID;
	full_name: string;
	phone: Nullable<string>;
	role_id: UUID;
	branch_id: Nullable<UUID>;
	status: AccountStatus;
	last_login_at: Nullable<Timestamp>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type RouteRow = {
	id: UUID;
	origin_branch_id: UUID;
	destination_branch_id: UUID;
	name: string;
	estimated_duration_minutes: Nullable<number>;
	base_fee: Money;
	is_active: boolean;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type RouteScheduleRow = {
	id: UUID;
	route_id: UUID;
	day_of_week: number;
	departure_time: TimeString;
	is_active: boolean;
	notes: Nullable<string>;
	created_at: Timestamp;
};

type RouteTariffRow = {
	id: UUID;
	route_id: UUID;
	service_type: ServiceType;
	minimum_service_fee: Money;
	percentage_fee: Percent;
	local_delivery_fee: Money;
	handling_fee: Money;
	effective_from: DateString;
	effective_until: Nullable<DateString>;
	is_active: boolean;
	created_at: Timestamp;
};

type SystemSettingRow = {
	id: UUID;
	branch_id: Nullable<UUID>;
	setting_key: string;
	setting_value: Json;
	description: Nullable<string>;
	is_public: boolean;
	created_by: Nullable<UUID>;
	updated_by: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type PositionRow = {
	id: UUID;
	code: string;
	name: string;
	level: number;
	description: Nullable<string>;
	created_at: Timestamp;
};

type EmployeeRow = {
	id: UUID;
	employee_number: string;
	profile_id: Nullable<UUID>;
	full_name: string;
	phone: Nullable<string>;
	email: Nullable<string>;
	address: Nullable<string>;
	branch_id: UUID;
	position_id: UUID;
	supervisor_employee_id: Nullable<UUID>;
	join_date: DateString;
	employment_status: EmploymentStatus;
	bank_name: Nullable<string>;
	bank_account: Nullable<string>;
	notes: Nullable<string>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type EmployeeAssignmentRow = {
	id: UUID;
	employee_id: UUID;
	branch_id: UUID;
	position_id: UUID;
	effective_from: DateString;
	effective_until: Nullable<DateString>;
	created_at: Timestamp;
};

type EmployeeCompensationRow = {
	id: UUID;
	employee_id: UUID;
	base_salary: Money;
	vehicle_allowance: Money;
	communication_allowance: Money;
	commission_rate: Percent;
	effective_from: DateString;
	effective_until: Nullable<DateString>;
	is_active: boolean;
	created_at: Timestamp;
};

type CustomerRow = {
	id: UUID;
	home_branch_id: Nullable<UUID>;
	name: string;
	phone: string;
	email: Nullable<string>;
	customer_type: CustomerType;
	address: Nullable<string>;
	district: Nullable<string>;
	city: Nullable<string>;
	landmark: Nullable<string>;
	status: AccountStatus;
	notes: Nullable<string>;
	first_transaction_at: Nullable<Timestamp>;
	created_by: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type StoreRow = {
	id: UUID;
	branch_id: Nullable<UUID>;
	name: string;
	address: Nullable<string>;
	city: Nullable<string>;
	phone: Nullable<string>;
	maps_url: Nullable<string>;
	opening_hours: Nullable<string>;
	notes: Nullable<string>;
	is_active: boolean;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type OrderRow = {
	id: UUID;
	tracking_number: string;
	service_type: ServiceType;
	fulfillment_method: FulfillmentMethod;
	origin_branch_id: UUID;
	destination_branch_id: UUID;
	route_id: UUID;
	sender_customer_id: UUID;
	receiver_customer_id: Nullable<UUID>;
	status: OrderStatus;
	payment_status: PaymentStatus;
	goods_amount: Money;
	service_revenue: Money;
	additional_service_fees: Money;
	discount_amount: Money;
	total_customer_payment: Money;
	delivery_address: Nullable<string>;
	public_notes: Nullable<string>;
	internal_notes: Nullable<string>;
	created_by: UUID;
	updated_by: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
	version: number;
};

type OrderItemRow = {
	id: UUID;
	order_id: UUID;
	store_id: Nullable<UUID>;
	product_name: string;
	product_url: Nullable<string>;
	quantity: number;
	estimated_unit_price: Money;
	actual_unit_price: Nullable<Money>;
	weight_grams: Nullable<number>;
	attributes: Json;
	notes: Nullable<string>;
	status: OrderItemStatus;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type TrackingEventRow = {
	id: UUID;
	order_id: UUID;
	status: OrderStatus;
	public_description: string;
	internal_description: Nullable<string>;
	location: Nullable<string>;
	created_by: Nullable<UUID>;
	created_at: Timestamp;
};

type PaymentRow = {
	id: UUID;
	order_id: UUID;
	amount: Money;
	payment_method: string;
	status: PaymentStatus;
	paid_at: Nullable<Timestamp>;
	verified_by: Nullable<UUID>;
	verified_at: Nullable<Timestamp>;
	notes: Nullable<string>;
	created_at: Timestamp;
};

type TripRow = {
	id: UUID;
	trip_number: string;
	route_id: UUID;
	origin_branch_id: UUID;
	destination_branch_id: UUID;
	departure_at: Nullable<Timestamp>;
	arrival_at: Nullable<Timestamp>;
	origin_staff_id: Nullable<UUID>;
	destination_staff_id: Nullable<UUID>;
	status: TripStatus;
	vehicle_description: Nullable<string>;
	notes: Nullable<string>;
	created_by: UUID;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type TripOrderRow = {
	trip_id: UUID;
	order_id: UUID;
	package_count: number;
	added_by: Nullable<UUID>;
	added_at: Timestamp;
};

type TripHandoverRow = {
	id: UUID;
	trip_id: UUID;
	handover_type: HandoverType;
	employee_id: UUID;
	total_packages: number;
	notes: Nullable<string>;
	confirmed_at: Timestamp;
	created_at: Timestamp;
};

type StaffTaskRow = {
	id: UUID;
	task_number: string;
	branch_id: UUID;
	trip_id: Nullable<UUID>;
	assigned_to: UUID;
	area: Nullable<string>;
	operational_budget: Money;
	status: TaskStatus;
	started_at: Nullable<Timestamp>;
	completed_at: Nullable<Timestamp>;
	notes: Nullable<string>;
	created_by: UUID;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type TaskItemRow = {
	id: UUID;
	task_id: UUID;
	order_item_id: UUID;
	status: TaskStatus;
	actual_price: Nullable<Money>;
	notes: Nullable<string>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type ExpenseCategoryRow = {
	id: UUID;
	code: string;
	name: string;
	scope: string;
	requires_receipt: boolean;
	is_active: boolean;
	created_at: Timestamp;
};

type CommissionPeriodRow = {
	id: UUID;
	branch_id: UUID;
	period_start: DateString;
	period_end: DateString;
	status: CommissionPeriodStatus;
	approved_by: Nullable<UUID>;
	approved_at: Nullable<Timestamp>;
	locked_at: Nullable<Timestamp>;
	created_at: Timestamp;
};

type DailyOperationalAdvanceRow = {
	id: UUID;
	employee_id: UUID;
	branch_id: UUID;
	task_id: Nullable<UUID>;
	trip_id: Nullable<UUID>;
	advance_date: DateString;
	amount: Money;
	status: AdvanceStatus;
	submitted_by: Nullable<UUID>;
	approved_by: Nullable<UUID>;
	disbursed_by: Nullable<UUID>;
	disbursed_at: Nullable<Timestamp>;
	settled_at: Nullable<Timestamp>;
	notes: Nullable<string>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type DailyOperationalExpenseRow = {
	id: UUID;
	advance_id: Nullable<UUID>;
	employee_id: UUID;
	branch_id: UUID;
	task_id: Nullable<UUID>;
	trip_id: Nullable<UUID>;
	category_id: UUID;
	expense_date: DateString;
	amount: Money;
	notes: Nullable<string>;
	approval_status: ExpenseApprovalStatus;
	approved_by: Nullable<UUID>;
	approved_at: Nullable<Timestamp>;
	commission_period_id: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type StaffTaskRevenueRow = {
	id: UUID;
	employee_id: UUID;
	task_id: UUID;
	order_id: UUID;
	revenue_type: StaffTaskRevenueType;
	gross_revenue: Money;
	allocated_revenue: Money;
	revenue_date: DateString;
	status: RevenueStatus;
	commission_period_id: Nullable<UUID>;
	created_at: Timestamp;
};

type EmployeeCommissionRow = {
	id: UUID;
	commission_period_id: UUID;
	employee_id: UUID;
	total_revenue: Money;
	total_operational_expense: Money;
	net_contribution: Money;
	commission_rate: Percent;
	commission_amount: Money;
	status: CommissionPeriodStatus;
	approved_by: Nullable<UUID>;
	approved_at: Nullable<Timestamp>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type PayrollPeriodRow = {
	id: UUID;
	branch_id: UUID;
	period_start: DateString;
	period_end: DateString;
	status: PayrollStatus;
	approved_by: Nullable<UUID>;
	approved_at: Nullable<Timestamp>;
	paid_at: Nullable<Timestamp>;
	locked_at: Nullable<Timestamp>;
	created_at: Timestamp;
};

type PayrollItemRow = {
	id: UUID;
	payroll_period_id: UUID;
	employee_id: UUID;
	item_type: PayrollItemType;
	description: string;
	amount: Money;
	reference_id: Nullable<UUID>;
	created_at: Timestamp;
};

type BranchExpenseRow = {
	id: UUID;
	branch_id: UUID;
	category_id: UUID;
	vendor: Nullable<string>;
	amount: Money;
	period_start: Nullable<DateString>;
	period_end: Nullable<DateString>;
	invoice_date: Nullable<DateString>;
	due_date: Nullable<DateString>;
	paid_at: Nullable<Timestamp>;
	status: BranchExpenseStatus;
	notes: Nullable<string>;
	created_by: UUID;
	approved_by: Nullable<UUID>;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type BranchBudgetRow = {
	id: UUID;
	branch_id: UUID;
	category_id: UUID;
	budget_month: DateString;
	budget_amount: Money;
	notes: Nullable<string>;
	created_by: UUID;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type BranchRentContractRow = {
	id: UUID;
	branch_id: UUID;
	landlord_name: string;
	start_date: DateString;
	end_date: DateString;
	total_amount: Money;
	payment_date: Nullable<DateString>;
	monthly_allocation: Money;
	status: AccountStatus;
	notes: Nullable<string>;
	created_by: UUID;
	created_at: Timestamp;
	updated_at: Timestamp;
};

type PettyCashTransactionRow = {
	id: UUID;
	branch_id: UUID;
	transaction_type: PettyCashTransactionType;
	category_id: Nullable<UUID>;
	amount: Money;
	employee_id: Nullable<UUID>;
	description: string;
	transaction_date: DateString;
	created_by: UUID;
	created_at: Timestamp;
};

type AttachmentRow = {
	id: UUID;
	entity_type: AttachmentEntityType;
	entity_id: UUID;
	object_key: string;
	original_filename: string;
	mime_type: string;
	size_bytes: number;
	is_private: boolean;
	uploaded_by: Nullable<UUID>;
	created_at: Timestamp;
};

type AuditLogRow = {
	id: number;
	actor_profile_id: Nullable<UUID>;
	action: string;
	entity_type: string;
	entity_id: Nullable<UUID>;
	old_values: Nullable<Json>;
	new_values: Nullable<Json>;
	ip_address: Nullable<string>;
	user_agent: Nullable<string>;
	created_at: Timestamp;
};



// >>> GENERATED INSERT/UPDATE TYPES >>>
type RoleInsert = Pick<RoleRow, 'code' | 'name'> & Partial<Pick<RoleRow, 'id' | 'description' | 'created_at'>>;
type RoleUpdate = Partial<Omit<RoleRow, 'id'>>;
type PermissionInsert = Pick<PermissionRow, 'code' | 'module' | 'name'> & Partial<Pick<PermissionRow, 'id' | 'description' | 'created_at'>>;
type PermissionUpdate = Partial<Omit<PermissionRow, 'id'>>;
type RolePermissionInsert = Pick<RolePermissionRow, 'role_id' | 'permission_id'> & Partial<Pick<RolePermissionRow, 'created_at'>>;
type RolePermissionUpdate = Partial<Omit<RolePermissionRow, 'role_id' | 'permission_id'>>;
type BranchInsert = Pick<BranchRow, 'code' | 'name' | 'city'> & Partial<Pick<BranchRow, 'id' | 'address' | 'whatsapp' | 'maps_url' | 'opening_hours' | 'is_active' | 'head_employee_id' | 'created_at' | 'updated_at'>>;
type BranchUpdate = Partial<Omit<BranchRow, 'id'>>;
type ProfileInsert = Pick<ProfileRow, 'id' | 'full_name' | 'role_id'> & Partial<Pick<ProfileRow, 'phone' | 'branch_id' | 'status' | 'last_login_at' | 'created_at' | 'updated_at'>>;
type ProfileUpdate = Partial<Omit<ProfileRow, 'id'>>;
type RouteInsert = Pick<RouteRow, 'origin_branch_id' | 'destination_branch_id' | 'name'> & Partial<Pick<RouteRow, 'id' | 'estimated_duration_minutes' | 'base_fee' | 'is_active' | 'created_at' | 'updated_at'>>;
type RouteUpdate = Partial<Omit<RouteRow, 'id'>>;
type RouteScheduleInsert = Pick<RouteScheduleRow, 'route_id' | 'day_of_week' | 'departure_time'> & Partial<Pick<RouteScheduleRow, 'id' | 'is_active' | 'notes' | 'created_at'>>;
type RouteScheduleUpdate = Partial<Omit<RouteScheduleRow, 'id'>>;
type RouteTariffInsert = Pick<RouteTariffRow, 'route_id' | 'service_type' | 'effective_from'> & Partial<Pick<RouteTariffRow, 'id' | 'minimum_service_fee' | 'percentage_fee' | 'local_delivery_fee' | 'handling_fee' | 'effective_until' | 'is_active' | 'created_at'>>;
type RouteTariffUpdate = Partial<Omit<RouteTariffRow, 'id'>>;
type SystemSettingInsert = Pick<SystemSettingRow, 'setting_key' | 'setting_value'> & Partial<Pick<SystemSettingRow, 'id' | 'branch_id' | 'description' | 'is_public' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>>;
type SystemSettingUpdate = Partial<Omit<SystemSettingRow, 'id'>>;
type PositionInsert = Pick<PositionRow, 'code' | 'name'> & Partial<Pick<PositionRow, 'id' | 'level' | 'description' | 'created_at'>>;
type PositionUpdate = Partial<Omit<PositionRow, 'id'>>;
type EmployeeInsert = Pick<EmployeeRow, 'employee_number' | 'full_name' | 'branch_id' | 'position_id' | 'join_date'> & Partial<Pick<EmployeeRow, 'id' | 'profile_id' | 'phone' | 'email' | 'address' | 'supervisor_employee_id' | 'employment_status' | 'bank_name' | 'bank_account' | 'notes' | 'created_at' | 'updated_at'>>;
type EmployeeUpdate = Partial<Omit<EmployeeRow, 'id'>>;
type EmployeeAssignmentInsert = Pick<EmployeeAssignmentRow, 'employee_id' | 'branch_id' | 'position_id' | 'effective_from'> & Partial<Pick<EmployeeAssignmentRow, 'id' | 'effective_until' | 'created_at'>>;
type EmployeeAssignmentUpdate = Partial<Omit<EmployeeAssignmentRow, 'id'>>;
type EmployeeCompensationInsert = Pick<EmployeeCompensationRow, 'employee_id' | 'effective_from'> & Partial<Pick<EmployeeCompensationRow, 'id' | 'base_salary' | 'vehicle_allowance' | 'communication_allowance' | 'commission_rate' | 'effective_until' | 'is_active' | 'created_at'>>;
type EmployeeCompensationUpdate = Partial<Omit<EmployeeCompensationRow, 'id'>>;
type CustomerInsert = Pick<CustomerRow, 'name' | 'phone'> & Partial<Pick<CustomerRow, 'id' | 'home_branch_id' | 'email' | 'customer_type' | 'address' | 'district' | 'city' | 'landmark' | 'status' | 'notes' | 'first_transaction_at' | 'created_by' | 'created_at' | 'updated_at'>>;
type CustomerUpdate = Partial<Omit<CustomerRow, 'id'>>;
type StoreInsert = Pick<StoreRow, 'name'> & Partial<Pick<StoreRow, 'id' | 'branch_id' | 'address' | 'city' | 'phone' | 'maps_url' | 'opening_hours' | 'notes' | 'is_active' | 'created_at' | 'updated_at'>>;
type StoreUpdate = Partial<Omit<StoreRow, 'id'>>;
type OrderInsert = Pick<OrderRow, 'tracking_number' | 'service_type' | 'origin_branch_id' | 'destination_branch_id' | 'route_id' | 'sender_customer_id' | 'created_by'> & Partial<Pick<OrderRow, 'id' | 'fulfillment_method' | 'receiver_customer_id' | 'status' | 'payment_status' | 'goods_amount' | 'service_revenue' | 'additional_service_fees' | 'discount_amount' | 'delivery_address' | 'public_notes' | 'internal_notes' | 'updated_by' | 'created_at' | 'updated_at' | 'version'>>;
type OrderUpdate = Partial<Omit<OrderRow, 'id' | 'total_customer_payment' | 'version'>>;
type OrderItemInsert = Pick<OrderItemRow, 'order_id' | 'product_name'> & Partial<Pick<OrderItemRow, 'id' | 'store_id' | 'product_url' | 'quantity' | 'estimated_unit_price' | 'actual_unit_price' | 'weight_grams' | 'attributes' | 'notes' | 'status' | 'created_at' | 'updated_at'>>;
type OrderItemUpdate = Partial<Omit<OrderItemRow, 'id'>>;
type TrackingEventInsert = Pick<TrackingEventRow, 'order_id' | 'status' | 'public_description'> & Partial<Pick<TrackingEventRow, 'id' | 'internal_description' | 'location' | 'created_by' | 'created_at'>>;
type TrackingEventUpdate = Partial<Omit<TrackingEventRow, 'id'>>;
type PaymentInsert = Pick<PaymentRow, 'order_id' | 'amount' | 'payment_method'> & Partial<Pick<PaymentRow, 'id' | 'status' | 'paid_at' | 'verified_by' | 'verified_at' | 'notes' | 'created_at'>>;
type PaymentUpdate = Partial<Omit<PaymentRow, 'id'>>;
type TripInsert = Pick<TripRow, 'trip_number' | 'route_id' | 'origin_branch_id' | 'destination_branch_id' | 'created_by'> & Partial<Pick<TripRow, 'id' | 'departure_at' | 'arrival_at' | 'origin_staff_id' | 'destination_staff_id' | 'status' | 'vehicle_description' | 'notes' | 'created_at' | 'updated_at'>>;
type TripUpdate = Partial<Omit<TripRow, 'id'>>;
type TripOrderInsert = Pick<TripOrderRow, 'trip_id' | 'order_id'> & Partial<Pick<TripOrderRow, 'package_count' | 'added_by' | 'added_at'>>;
type TripOrderUpdate = Partial<Omit<TripOrderRow, 'trip_id' | 'order_id'>>;
type TripHandoverInsert = Pick<TripHandoverRow, 'trip_id' | 'handover_type' | 'employee_id' | 'total_packages'> & Partial<Pick<TripHandoverRow, 'id' | 'notes' | 'confirmed_at' | 'created_at'>>;
type TripHandoverUpdate = Partial<Omit<TripHandoverRow, 'id'>>;
type StaffTaskInsert = Pick<StaffTaskRow, 'task_number' | 'branch_id' | 'assigned_to' | 'created_by'> & Partial<Pick<StaffTaskRow, 'id' | 'trip_id' | 'area' | 'operational_budget' | 'status' | 'started_at' | 'completed_at' | 'notes' | 'created_at' | 'updated_at'>>;
type StaffTaskUpdate = Partial<Omit<StaffTaskRow, 'id'>>;
type TaskItemInsert = Pick<TaskItemRow, 'task_id' | 'order_item_id'> & Partial<Pick<TaskItemRow, 'id' | 'status' | 'actual_price' | 'notes' | 'created_at' | 'updated_at'>>;
type TaskItemUpdate = Partial<Omit<TaskItemRow, 'id'>>;
type ExpenseCategoryInsert = Pick<ExpenseCategoryRow, 'code' | 'name' | 'scope'> & Partial<Pick<ExpenseCategoryRow, 'id' | 'requires_receipt' | 'is_active' | 'created_at'>>;
type ExpenseCategoryUpdate = Partial<Omit<ExpenseCategoryRow, 'id'>>;
type CommissionPeriodInsert = Pick<CommissionPeriodRow, 'branch_id' | 'period_start' | 'period_end'> & Partial<Pick<CommissionPeriodRow, 'id' | 'status' | 'approved_by' | 'approved_at' | 'locked_at' | 'created_at'>>;
type CommissionPeriodUpdate = Partial<Omit<CommissionPeriodRow, 'id'>>;
type DailyOperationalAdvanceInsert = Pick<DailyOperationalAdvanceRow, 'employee_id' | 'branch_id' | 'advance_date' | 'amount'> & Partial<Pick<DailyOperationalAdvanceRow, 'id' | 'task_id' | 'trip_id' | 'status' | 'submitted_by' | 'approved_by' | 'disbursed_by' | 'disbursed_at' | 'settled_at' | 'notes' | 'created_at' | 'updated_at'>>;
type DailyOperationalAdvanceUpdate = Partial<Omit<DailyOperationalAdvanceRow, 'id'>>;
type DailyOperationalExpenseInsert = Pick<DailyOperationalExpenseRow, 'employee_id' | 'branch_id' | 'category_id' | 'expense_date' | 'amount'> & Partial<Pick<DailyOperationalExpenseRow, 'id' | 'advance_id' | 'task_id' | 'trip_id' | 'notes' | 'approval_status' | 'approved_by' | 'approved_at' | 'commission_period_id' | 'created_at' | 'updated_at'>>;
type DailyOperationalExpenseUpdate = Partial<Omit<DailyOperationalExpenseRow, 'id'>>;
type StaffTaskRevenueInsert = Pick<StaffTaskRevenueRow, 'employee_id' | 'task_id' | 'order_id' | 'revenue_type' | 'gross_revenue' | 'allocated_revenue' | 'revenue_date'> & Partial<Pick<StaffTaskRevenueRow, 'id' | 'status' | 'commission_period_id' | 'created_at'>>;
type StaffTaskRevenueUpdate = Partial<Omit<StaffTaskRevenueRow, 'id'>>;
type EmployeeCommissionInsert = Pick<EmployeeCommissionRow, 'commission_period_id' | 'employee_id' | 'commission_rate'> & Partial<Pick<EmployeeCommissionRow, 'id' | 'total_revenue' | 'total_operational_expense' | 'status' | 'approved_by' | 'approved_at' | 'created_at' | 'updated_at'>>;
type EmployeeCommissionUpdate = Partial<Omit<EmployeeCommissionRow, 'id' | 'net_contribution' | 'commission_amount'>>;
type PayrollPeriodInsert = Pick<PayrollPeriodRow, 'branch_id' | 'period_start' | 'period_end'> & Partial<Pick<PayrollPeriodRow, 'id' | 'status' | 'approved_by' | 'approved_at' | 'paid_at' | 'locked_at' | 'created_at'>>;
type PayrollPeriodUpdate = Partial<Omit<PayrollPeriodRow, 'id'>>;
type PayrollItemInsert = Pick<PayrollItemRow, 'payroll_period_id' | 'employee_id' | 'item_type' | 'description' | 'amount'> & Partial<Pick<PayrollItemRow, 'id' | 'reference_id' | 'created_at'>>;
type PayrollItemUpdate = Partial<Omit<PayrollItemRow, 'id'>>;
type BranchExpenseInsert = Pick<BranchExpenseRow, 'branch_id' | 'category_id' | 'amount' | 'created_by'> & Partial<Pick<BranchExpenseRow, 'id' | 'vendor' | 'period_start' | 'period_end' | 'invoice_date' | 'due_date' | 'paid_at' | 'status' | 'notes' | 'approved_by' | 'created_at' | 'updated_at'>>;
type BranchExpenseUpdate = Partial<Omit<BranchExpenseRow, 'id'>>;
type BranchBudgetInsert = Pick<BranchBudgetRow, 'branch_id' | 'category_id' | 'budget_month' | 'budget_amount' | 'created_by'> & Partial<Pick<BranchBudgetRow, 'id' | 'notes' | 'created_at' | 'updated_at'>>;
type BranchBudgetUpdate = Partial<Omit<BranchBudgetRow, 'id'>>;
type BranchRentContractInsert = Pick<BranchRentContractRow, 'branch_id' | 'landlord_name' | 'start_date' | 'end_date' | 'total_amount' | 'monthly_allocation' | 'created_by'> & Partial<Pick<BranchRentContractRow, 'id' | 'payment_date' | 'status' | 'notes' | 'created_at' | 'updated_at'>>;
type BranchRentContractUpdate = Partial<Omit<BranchRentContractRow, 'id'>>;
type PettyCashTransactionInsert = Pick<PettyCashTransactionRow, 'branch_id' | 'transaction_type' | 'amount' | 'description' | 'transaction_date' | 'created_by'> & Partial<Pick<PettyCashTransactionRow, 'id' | 'category_id' | 'employee_id' | 'created_at'>>;
type PettyCashTransactionUpdate = Partial<Omit<PettyCashTransactionRow, 'id'>>;
type AttachmentInsert = Pick<AttachmentRow, 'entity_type' | 'entity_id' | 'object_key' | 'original_filename' | 'mime_type' | 'size_bytes'> & Partial<Pick<AttachmentRow, 'id' | 'is_private' | 'uploaded_by' | 'created_at'>>;
type AttachmentUpdate = Partial<Omit<AttachmentRow, 'id'>>;
type AuditLogInsert = Pick<AuditLogRow, 'action' | 'entity_type'> & Partial<Pick<AuditLogRow, 'actor_profile_id' | 'entity_id' | 'old_values' | 'new_values' | 'ip_address' | 'user_agent' | 'created_at'>>;
type AuditLogUpdate = Partial<Omit<AuditLogRow, 'id'>>;
// <<< GENERATED INSERT/UPDATE TYPES <<<

export type Database = {
	public: {
		Tables: {
			roles: Table<RoleRow, RoleInsert, RoleUpdate>;
			permissions: Table<PermissionRow, PermissionInsert, PermissionUpdate>;
			role_permissions: Table<RolePermissionRow, RolePermissionInsert, RolePermissionUpdate>;
			branches: Table<BranchRow, BranchInsert, BranchUpdate>;
			profiles: Table<ProfileRow, ProfileInsert, ProfileUpdate>;
			routes: Table<RouteRow, RouteInsert, RouteUpdate>;
			route_schedules: Table<RouteScheduleRow, RouteScheduleInsert, RouteScheduleUpdate>;
			route_tariffs: Table<RouteTariffRow, RouteTariffInsert, RouteTariffUpdate>;
			system_settings: Table<SystemSettingRow, SystemSettingInsert, SystemSettingUpdate>;
			positions: Table<PositionRow, PositionInsert, PositionUpdate>;
			employees: Table<EmployeeRow, EmployeeInsert, EmployeeUpdate>;
			employee_assignments: Table<EmployeeAssignmentRow, EmployeeAssignmentInsert, EmployeeAssignmentUpdate>;
			employee_compensations: Table<EmployeeCompensationRow, EmployeeCompensationInsert, EmployeeCompensationUpdate>;
			customers: Table<CustomerRow, CustomerInsert, CustomerUpdate>;
			stores: Table<StoreRow, StoreInsert, StoreUpdate>;
			orders: Table<OrderRow, OrderInsert, OrderUpdate>;
			order_items: Table<OrderItemRow, OrderItemInsert, OrderItemUpdate>;
			tracking_events: Table<TrackingEventRow, TrackingEventInsert, TrackingEventUpdate>;
			payments: Table<PaymentRow, PaymentInsert, PaymentUpdate>;
			trips: Table<TripRow, TripInsert, TripUpdate>;
			trip_orders: Table<TripOrderRow, TripOrderInsert, TripOrderUpdate>;
			trip_handovers: Table<TripHandoverRow, TripHandoverInsert, TripHandoverUpdate>;
			staff_tasks: Table<StaffTaskRow, StaffTaskInsert, StaffTaskUpdate>;
			task_items: Table<TaskItemRow, TaskItemInsert, TaskItemUpdate>;
			expense_categories: Table<ExpenseCategoryRow, ExpenseCategoryInsert, ExpenseCategoryUpdate>;
			commission_periods: Table<CommissionPeriodRow, CommissionPeriodInsert, CommissionPeriodUpdate>;
			daily_operational_advances: Table<DailyOperationalAdvanceRow, DailyOperationalAdvanceInsert, DailyOperationalAdvanceUpdate>;
			daily_operational_expenses: Table<DailyOperationalExpenseRow, DailyOperationalExpenseInsert, DailyOperationalExpenseUpdate>;
			staff_task_revenues: Table<StaffTaskRevenueRow, StaffTaskRevenueInsert, StaffTaskRevenueUpdate>;
			employee_commissions: Table<EmployeeCommissionRow, EmployeeCommissionInsert, EmployeeCommissionUpdate>;
			payroll_periods: Table<PayrollPeriodRow, PayrollPeriodInsert, PayrollPeriodUpdate>;
			payroll_items: Table<PayrollItemRow, PayrollItemInsert, PayrollItemUpdate>;
			branch_expenses: Table<BranchExpenseRow, BranchExpenseInsert, BranchExpenseUpdate>;
			branch_budgets: Table<BranchBudgetRow, BranchBudgetInsert, BranchBudgetUpdate>;
			branch_rent_contracts: Table<BranchRentContractRow, BranchRentContractInsert, BranchRentContractUpdate>;
			petty_cash_transactions: Table<PettyCashTransactionRow, PettyCashTransactionInsert, PettyCashTransactionUpdate>;
			attachments: Table<AttachmentRow, AttachmentInsert, AttachmentUpdate>;
			audit_logs: Table<AuditLogRow, AuditLogInsert, AuditLogUpdate>;
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			account_status: AccountStatus;
			employment_status: EmploymentStatus;
			customer_type: CustomerType;
			service_type: ServiceType;
			fulfillment_method: FulfillmentMethod;
			order_status: OrderStatus;
			order_item_status: OrderItemStatus;
			payment_status: PaymentStatus;
			trip_status: TripStatus;
			task_status: TaskStatus;
			handover_type: HandoverType;
			advance_status: AdvanceStatus;
			expense_approval_status: ExpenseApprovalStatus;
			commission_period_status: CommissionPeriodStatus;
			payroll_status: PayrollStatus;
			payroll_item_type: PayrollItemType;
			branch_expense_status: BranchExpenseStatus;
			petty_cash_transaction_type: PettyCashTransactionType;
			attachment_entity_type: AttachmentEntityType;
			revenue_status: RevenueStatus;
			staff_task_revenue_type: StaffTaskRevenueType;
		};
		CompositeTypes: Record<string, never>;
	};
};
