const commonActions: Record<string, string> = {
 ALERT_GOING_REMOVED_NO_SHOW: "Respuesta Voy eliminada: no figuró en la planilla de la intervención", ATTENDANCE_CLOSED_BY_ADMIN: "Permanencia cerrada por el administrador tecnico", MISSION_DRIVER_NOT_AUTHORIZED: "Salida rechazada: conductor no habilitado", DOCUMENT_PUBLISHED_EDITED: "Acta publicada editada dentro de las 24 horas",
 SPECIAL_PERMISSION_GRANTED: "Permiso especial concedido", SPECIAL_PERMISSION_REVOKED: "Permiso especial revocado",
 SHIFT_SWAP_REQUESTED: "Intercambio de guardia propuesto", SHIFT_SWAP_ACCEPTED: "Cobertura de guardia aceptada; pendiente de jefatura", SHIFT_SWAP_APPROVED: "Intercambio de guardia aprobado", SHIFT_SWAP_REJECTED: "Intercambio de guardia rechazado", SHIFT_SWAP_CANCELLED: "Propuesta de intercambio cancelada",
 INSPECTION_PARTICIPANT_REMOVED: "Participante no firmante retirado del control con recalculo",
 WORK_TRANSFER_REQUESTED: "Transferencia propuesta al destinatario", WORK_TRANSFER_CANCELLED: "Propuesta de transferencia cancelada", WORK_TRANSFER_REJECTED: "Propuesta de transferencia rechazada", WORK_TRANSFER: "Responsabilidad de tarea transferida por aceptacion", WORK_DECLINE: "Imposibilidad informada con descuento y liberacion de la tarea",
 ATTENDANCE_CORRECTION_REQUESTED: "Correccion de presencia solicitada para doble autorizacion", ATTENDANCE_CORRECTION_APPROVED: "Correccion de presencia aprobada de forma independiente", ATTENDANCE_CORRECTION_REJECTED: "Correccion de presencia rechazada",
 PERSONAL_PROFILE_UPDATED: "Perfil personal actualizado", PERSONAL_DECLARATIONS_VIEWED: "Declaraciones personales consultadas",
 DECLARATION_CREATED: "Pertenencia o licencia declarada", DECLARATION_UPDATED: "Declaracion personal modificada", DECLARATION_ARCHIVED: "Declaracion personal retirada",
 EMERGENCY_UNAVAILABILITY_CREATED: "Periodo de indisponibilidad registrado", EMERGENCY_PERIOD_CANCELLED: "Periodo de indisponibilidad cancelado", EMERGENCY_AVAILABLE_NOW: "Disponibilidad inmediata declarada",
 PERSONAL_EQUIPMENT_CREATED: "Prenda institucional registrada", PERSONAL_EQUIPMENT_UPDATED: "Prenda institucional modificada", PERSONAL_EQUIPMENT_CHECKED: "Condicion de prenda revisada",
 PERSONAL_EQUIPMENT_ISSUED: "Prenda entregada en custodia", PERSONAL_EQUIPMENT_RETURNED: "Prenda devuelta al cuartel", PERSONAL_EQUIPMENT_ARCHIVED: "Prenda institucional retirada",
 EQUIPMENT_REQUEST_APPROVED: "Solicitud de prenda aprobada", EQUIPMENT_REQUEST_REJECTED: "Solicitud de prenda rechazada",
 AIR_CYLINDER_CREATED: "Cilindro ERA registrado", AIR_COMPRESSOR_CREATED: "Compresor registrado", AIR_HYDRO_REGISTERED: "Prueba hidraulica registrada",
 AIR_STATE_REVIEWED: "Habilitacion de equipo de aire revisada", AIR_CYLINDER_MOVED: "Cilindro reubicado", AIR_PRESSURE_MEASURED: "Presion de cilindro medida",
 AIR_FILTER_CHANGED: "Filtro del compresor reemplazado", AIR_EQUIPMENT_RETIRED: "Equipo de aire dado de baja", AIR_FILL_RECORDED: "Carga de aire registrada",
 WORK_CLAIMED: "Tarea tomada por un integrante", WORK_REPORTED: "Trabajo realizado declarado", WORK_DECLINED: "Imposibilidad de realizar tarea informada",
 WORK_ASSIGNED: "Tarea asignada", WORK_SELF_REPORTED: "Trabajo propio informado", WORK_TAKEN: "Tarea tomada voluntariamente", CREATED: "Registro creado", CANCELLED: "Registro cancelado",
 AUTH_LOGIN: "Inicio de sesion", AUTH_PASSWORD_CHANGED: "Contraseña cambiada por su titular", AUTH_SESSION_REVOKED: "Sesion cerrada",
 AUTH_OTHER_SESSIONS_REVOKED: "Otras sesiones revocadas", AUTH_REFRESH_REPLAY_BLOCKED: "Reutilizacion de sesion bloqueada",
 ALERT_CREATED: "Alerta emitida", ALERT_RESOLVED: "Alerta finalizada", ALERT_CANCELLED: "Alerta cancelada con motivo", ALERT_RESPONDED: "Respuesta a convocatoria registrada", ALERT_RESPONSE_CHANGED: "Respuesta a convocatoria corregida", ALERT_NO_SHOW_RECORDED: "Ausencia a convocatoria registrada",
 ALERT_RESOLVED_BY_INCIDENT_CLOSE: "Alerta finalizada al cerrar la intervencion",
 USER_CREATED: "Cuenta creada", CHECK_IN: "Ingreso al cuartel registrado", CHECK_OUT: "Salida del cuartel registrada",
 CHAT_MESSAGE_CREATED: "Mensaje publicado", CHAT_MESSAGE_UPDATED: "Mensaje editado", CHAT_MESSAGE_DELETED: "Mensaje eliminado",
 CHAT_MESSAGE_PINNED: "Mensaje fijado", CHAT_MESSAGE_UNPINNED: "Mensaje desfijado", MESSAGE_ACKNOWLEDGED: "Lectura confirmada personalmente",
 MESSAGE_RECEIPTS_VIEWED: "Confirmaciones de lectura consultadas", PRIVATE_PROFILE_VIEWED: "Perfil privado consultado",
 PERSONAL_STATISTICS_VIEWED: "Estadisticas personales consultadas", PERSONAL_ACTIVITY_VIEWED: "Actividad individual consultada",
 APPLICATION_APPROVED: "Solicitud de ingreso aprobada", APPLICATION_REJECTED: "Solicitud de ingreso rechazada",
 ASSET_CREATED: "Equipo registrado", ASSET_UPDATED: "Equipo modificado", ASSET_DELETED: "Equipo dado de baja", VEHICLE_UPSERTED: "Ficha de movil guardada",
 INCIDENT_CREATED: "Intervencion registrada", INCIDENT_UPDATED: "Intervencion modificada", INCIDENT_CLOSED: "Intervencion cerrada",
 INCIDENT_USERS_ASSIGNED: "Personal asignado a una intervencion", INCIDENT_DISPATCHED_FROM_ALERT: "Intervencion abierta desde convocatoria",
 INCIDENT_UPDATE_CREATED: "Novedad de intervencion registrada", INCIDENT_UPDATE_DELETED: "Novedad de intervencion retirada",
 SHIFT_CREATED: "Turno de guardia creado", SHIFT_UPDATED: "Turno de guardia modificado", SHIFT_DELETED: "Turno de guardia retirado", SHIFT_USERS_ASSIGNED: "Personal de guardia asignado",
 INSPECTION_CREATED: "Control vehicular registrado", STATION_QR_CREATED: "QR de ingreso habilitado", STATION_QR_REVOKED: "QR de ingreso revocado",
 COMPLIANCE_RECORD_CREATED: "Vencimiento registrado", COMPLIANCE_RECORD_UPDATED: "Vencimiento modificado", COMPLIANCE_RECORD_DELETED: "Vencimiento retirado",
 CONTACT_CREATED: "Contacto operativo registrado", CONTACT_UPDATED: "Contacto operativo modificado", CONTACT_DELETED: "Contacto operativo retirado",
 VEHICLE_DEPARTURE_RECORDED: "Salida de movil registrada", VEHICLE_DEPARTURE_VOIDED: "Salida de movil anulada",
 FUEL_CREATED: "Carga de combustible registrada", FUEL_VOIDED: "Carga de combustible anulada", WATER_TRIP_CREATED: "Viaje de agua registrado", WATER_TRIP_VOIDED: "Viaje de agua anulado",
 AVAILABILITY_UPDATED: "Disponibilidad modificada", DOCUMENT_CREATED: "Documento registrado", DOCUMENT_UPDATED: "Documento modificado",
 MAINTENANCE_CREATED: "Mantenimiento registrado", MAINTENANCE_STATUS_CHANGED: "Estado de mantenimiento modificado", MAINTENANCE_TASK_CREATED: "Tarea creada desde mantenimiento",
 SERVICE_ATTENDANCE_RECORDED: "Asistencia a servicio declarada", SERVICE_ATTENDANCE_VERIFIED: "Asistencia a servicio verificada", SERVICE_ATTENDANCE_CANCELLED: "Asistencia a servicio anulada", SERVICE_ATTENDANCE_VIEWED: "Asistencia a servicio consultada",
 CONTROL_GROUP_SAVED: "Grupo de control guardado", CONTROL_GROUP_MEMBER_ARCHIVED: "Integrante retirado del grupo de control",
 NOTIFICATION_READ: "Notificación marcada como leída", NOTIFICATION_READ_ALL: "Todas las notificaciones marcadas como leídas", NOTEBOOK_RETIRED: "Entrada de libreta retirada", WORK_TEAM_CHANGED: "Equipo de tarea modificado",
 EQUIPMENT_REQUEST_CREATED: "Prenda solicitada", EQUIPMENT_REQUEST_EDITED: "Solicitud de prenda modificada", EQUIPMENT_REQUEST_CANCELLED: "Solicitud de prenda cancelada", EQUIPMENT_REQUEST_FULFILLED: "Prenda solicitada entregada",
 WORK_CREATED: "Tarea creada", WORK_SUBMITTED: "Trabajo enviado para verificacion", WORK_VERIFIED: "Trabajo verificado", WORK_RETURNED: "Trabajo devuelto para completar", WORK_CANCELLED: "Tarea cancelada",
 SYSTEM_DEMO_CREDENTIALS_RESET: "Credenciales de demostracion restablecidas", DEMO_COMPREHENSIVE_SEEDED: "Datos de demostracion cargados", SYSTEM_DEMO_BUSINESS_REPAIRED: "Datos sinteticos corregidos",
};
export const auditEntities: Record<string, string> = {
 User: "Cuenta de personal", Member: "Integrante", Alert: "Alerta", Incident: "Intervencion", Inspection: "Control vehicular", Shift: "Guardia", ChatMessage: "Mensaje",
 Asset: "Equipo o movil", ExpenseClaim: "Gasto y reintegro", ExpensePayment: "Pago de reintegro", WaterTrip: "Viaje de agua", FuelRecord: "Carga de combustible",
 WorkTask: "Tarea", MaintenanceJob: "Mantenimiento", OperationalDocument: "Documento", Document: "Documento", AuthSession: "Sesion", HttpRequest: "Acceso al sistema",
 Attendance: "Permanencia", ControlDraft: "Borrador de control", CourseAttendance: "Curso declarado", DispatchNotice: "Llamada o aviso", PersonalDeclaration: "Declaracion personal",
 ControlGroup: "Grupo de control", MissionMovement: "Movimiento de dotacion", IncidentSheet: "Planilla de intervencion", RankingPolicy: "Reglas de puntaje", RankingTemplate: "Plantilla de tarea",
 System: "Sistema", PersonalEquipment: "Vestimenta institucional", ComplianceRecord: "Vencimiento", OperationalContact: "Contacto operativo", Station: "Cuartel",
 AirEquipment: "Equipamiento de aire", AirCylinder: "Cilindro ERA", AirCompressor: "Compresor", AirFill: "Carga de aire", PersonalEquipmentRequest: "Solicitud de prenda", ServiceParticipation: "Asistencia a servicio", IncidentNotebookEntry: "Entrada de libreta", VehicleDeparture: "Salida de movil", VolunteerApplication: "Solicitud de ingreso", EmergencyAvailability: "Disponibilidad", PushSubscription: "Suscripcion a notificaciones",
};
export function auditEntity(value: string) { return auditEntities[value] || "Registro del sistema"; }
export function auditAction(action: string) {
  const labels: Record<string, string> = { USER_UPDATED: "Datos o permisos del personal modificados", USER_ARCHIVED: "Cuenta dada de baja; historial conservado", USER_PASSWORD_RESET: "Acceso restablecido por administracion", ATTENDANCE_CLOSED_BY_DUTY: "Permanencia cerrada por responsable de guardia", ATTENDANCE_CLOSED_ON_USER_ARCHIVE: "Permanencia cerrada por baja de cuenta", INSPECTION_AMENDED: "Aclaracion de control vehicular corregida", INSPECTION_VOIDED: "Control vehicular anulado; requiere revision", HTTP_ACCESS_DENIED: "Intento de acceso rechazado", HTTP_MUTATION: "Solicitud de modificacion al sistema" };
  Object.assign(labels, {
    WATER_EARNINGS_APPROVED: "Ganancias de viaje revisadas independientemente y deuda reconocida",
    CONTROL_DRAFT_STARTED: "Control iniciado con asistencia QR registrada",
    CONTROL_DRAFT_TEAM_CHANGED: "Participantes del control actualizados con evidencia de asistencia",
    CONTROL_DRAFT_ABANDONED: "Borrador de control descartado sin finalizar",
    OFFICER_EXPENSE_AUTHORIZED: "Gasto de oficial autorizado personalmente por suboficial",
    FINANCE_CHIEF_CHANGED: "Acceso del jefe financiero modificado con motivo",
    EXPENSE_SUBMITTED: "Gasto presentado para reintegro",
    EXPENSE_APPROVED: "Reintegro aprobado y deuda reconocida",
    EXPENSE_REJECTED: "Gasto rechazado con motivo",
    EXPENSE_PAYMENT_RECORDED: "Pago parcial o total de reintegro registrado",
    EXPENSE_PAYMENT_REVERSED: "Constancia de pago revertida; deuda restablecida",
    RANKING_RECOVERY_ASSIGNED: "Tarea de recuperación asignada por sorteo",
    RANKING_POLICY_UPDATED: "Reglas de puntaje modificadas con motivo",
    RANKING_TEMPLATE_CREATED: "Plantilla de recuperación registrada",
    RANKING_TEMPLATE_UPDATED: "Plantilla de recuperación modificada o archivada",
    INCIDENT_SHEET_AMENDED: "Enmienda permanente agregada a planilla cerrada",
    DRIVER_AUTHORIZATION_REVOKED: "Habilitación de conducción retirada con motivo",
    WORK_PLANNING_UPDATED: "Responsable, prioridad o plazo de tarea planificado",
    PUSH_SUBSCRIBED: "Dispositivo habilitado para notificaciones externas",
    PUSH_UNSUBSCRIBED: "Notificaciones externas desactivadas en el dispositivo",
    FUEL_CORRECTED: "Carga de combustible rectificada; original conservado",
    WATER_TRIP_CORRECTED: "Viaje de agua rectificado; original conservado",
    GUARD_FUNCTION_GRANTED: "Función adicional de guardia habilitada",
    GUARD_FUNCTION_REVOKED: "Función adicional de guardia revocada",
    SESSION_ACCESS_MODE_CHANGED: "Modo de trabajo de la sesión cambiado",
    SYSTEM_PRESENCE_TIMED_OUT: "Permanencia cerrada automáticamente por falta de confirmación",
    INCIDENT_SHEET_CREATED: "Planilla de intervención registrada",
    INCIDENT_SHEET_UPDATED: "Borrador de planilla de intervención corregido",
    INCIDENT_SHEET_FINALIZED: "Planilla de intervención cerrada y conciliada",
    MISSION_DEPARTED: "Dotación despachada en un móvil",
    MISSION_ARRIVED: "Llegada al lugar de la intervención registrada",
    MISSION_RETURNED: "Retorno de la dotación al cuartel registrado",
    MISSION_RETURNED_WITHOUT_ARRIVAL: "Regreso sin llegada al lugar, con motivo",
    DRIVER_AUTHORIZATION_SAVED: "Habilitación de conductor por móvil registrada",
    INSPECTION_PARTICIPATION_CONFIRMED: "Participante confirmó el control vehicular",
    INSPECTION_REPAIR_ASSIGNED: "Reparación asignada por una falla en control vehicular",
    DOCUMENT_RECTIFICATION_CREATED: "Borrador de rectificación de documento iniciado",
    DOCUMENT_REPLACED_BY_RECTIFICATION: "Documento archivado por una nueva versión publicada",
    COURSE_SUBMITTED: "Curso declarado para revisión",
    COURSE_APPROVED: "Asistencia a curso aprobada",
    COURSE_REJECTED: "Asistencia a curso rechazada",
    NOTICE_RECEIVED: "Llamada o aviso registrado",
    NOTICE_CORRECTED: "Aviso pendiente corregido con motivo e historial",
    NOTICE_CANCELLED: "Aviso anulado sin borrar el registro original",
    NOTICE_ACTIVATED: "Convocatoria emitida desde un aviso",
  });
  if (labels[action]) return labels[action];
  return commonActions[action] || "Accion del sistema";
}
const fields: Record<string, string> = {
 permission: "Permiso especial", specialPermissions: "Permisos especiales", scope: "Alcance del sorteo", swapId: "Solicitud de intercambio", transferId: "Propuesta de transferencia", fromUserId: "Responsable anterior", toUserId: "Persona propuesta", requiresPresence: "Requiere presencia QR", discardedAt: "Permanencia descartada", discardReason: "Motivo de descarte", effectiveAt: "Fecha efectiva", requestedByUserId: "Solicitante", decidedByUserId: "Responsable de aprobacion", decisionNote: "Resolucion", declinedTask: "Descuento por imposibilidad", declinedTasks: "Imposibilidades informadas", previousRevision: "Revision anterior", complete: "Control completo", receiptSha256: "Referencia del comprobante validado",
 snapshot: "Datos registrados", name: "Nombre", code: "Codigo de identificacion", kind: "Clase de registro", from: "Origen", to: "Destino", action: "Accion",
 initialTotalMinutes: "Minutos iniciales de funcionamiento", initialFilterUsedMinutes: "Minutos iniciales de uso del filtro", testId: "Prueba hidraulica", checkId: "Revision de prenda",
 pressureBar: "Presion en bar", previousPressureBar: "Presion anterior en bar", runMinutes: "Minutos de funcionamiento", totalRunMinutes: "Minutos acumulados del compresor",
 airQualityReference: "Certificado de calidad del aire", airQualityValidUntil: "Vigencia de calidad del aire", cylinderIds: "Cilindros cargados", compressorId: "Compresor", changeId: "Cambio de filtro",
 issueId: "Entrega de prenda", equipmentId: "Prenda institucional", filterReference: "Referencia del filtro", required: "Obligatorio",
 brand: "Marca", model: "Modelo", size: "Talle", state: "Estado", labelCode: "Codigo de inventario", compartmentId: "Compartimento", sortOrder: "Orden",
 originalId: "Registro original", replacementId: "Registro de reemplazo", replacesId: "Registro rectificado", correctionReason: "Motivo de rectificacion", originalRevision: "Revision anterior",
 maintenanceJobId: "Mantenimiento asociado", repairTaskId: "Tarea de reparacion", taskId: "Tarea", blocksOperation: "Bloquea operacion", resolution: "Resolucion", officerApproved: "Avalado por oficial",
 previousStatus: "Estado anterior", nextStatus: "Estado nuevo", previousUserIds: "Personal anterior", nextUserIds: "Personal nuevo", active: "Activo", mode: "Modo de trabajo",
 confirmationsComplete: "Todas las conformidades registradas", revokedAt: "Revocacion", expiresAt: "Vencimiento", paidAt: "Pago registrado", reversedAt: "Reversion del pago", earningsApprovedAt: "Remuneraciones aprobadas",
 earningsApprovedById: "Responsable de revision financiera", earningsApprovalNote: "Verificacion financiera", clientPaidAt: "Cobro al cliente", returnWithoutArrivalReason: "Motivo de regreso sin llegada",
 startTime: "Hora inicial", endTime: "Hora final", repeatWeeks: "Repeticion en semanas", startsOn: "Fecha de inicio", groupId: "Grupo", shiftId: "Guardia", shiftType: "Tipo de guardia",
 startedOn: "Fecha de inicio", completedOn: "Fecha de curso", provider: "Institucion del curso", reviewerId: "Revisor", reviewNote: "Resultado de revision", completionNotes: "Detalle del trabajo",
 changes: "Cambios", field: "Campo modificado", before: "Antes", after: "Despues", reason: "Motivo", note: "Observacion", notes: "Observaciones", title: "Concepto", description: "Detalle",
 username: "Usuario", usernames: "Usuarios", fullName: "Nombre completo", dni: "DNI", badge: "Legajo", email: "Correo", phone: "Telefono", altPhone: "Telefono alternativo",
 address: "Domicilio", bloodType: "Grupo sanguineo", birthDate: "Nacimiento", joinDate: "Ingreso al cuerpo", emergencyContact: "Contacto de emergencia", relationship: "Relacion",
 id: "Identificador", userId: "Integrante", userIds: "Personal", actorUserId: "Responsable de la accion", operatorId: "Operador", createdByUserId: "Registrado por",
 previousRole: "Permiso anterior", nextRole: "Permiso nuevo", previousRank: "Cargo anterior", nextRank: "Cargo nuevo", role: "Permiso de acceso", rank: "Cargo", rankSnapshot: "Cargo al autorizar",
 isActive: "Cuenta activa", isPendingApproval: "Ingreso pendiente", guardEligible: "Funcion de guardia habilitada", financeChief: "Jefe financiero", enabled: "Habilitado",
 revision: "Revision utilizada", nextRevision: "Nueva revision", licenseRevision: "Revision de licencia", authorizationRevision: "Revision de habilitacion", licenseId: "Licencia revisada",
 licenseExpiresOn: "Vencimiento de licencia", authorizationValidUntil: "Habilitacion hasta", validUntil: "Vigente hasta", expiresOn: "Vencimiento", issuedOn: "Fecha de emision", issuer: "Emisor",
 licenseNumber: "Numero de licencia", licenseClasses: "Clases de licencia", requiredClass: "Clase requerida",
 sessionsRevoked: "Sesiones revocadas", requiresPhysicalReview: "Requiere control fisico", method: "Operacion realizada", route: "Ruta del sistema", status: "Estado", decision: "Decision",
 amountCents: "Importe", costCents: "Costo", compensationCents: "Remuneracion", chargeCents: "Importe al cliente", paidCents: "Importe pagado", debtCents: "Saldo pendiente",
 paymentId: "Constancia de pago", approvalId: "Autorizacion", claimId: "Gasto", authorizations: "Autorizaciones", reference: "Comprobante o referencia", receiptUrl: "Enlace al comprobante",
 crew: "Dotacion", participants: "Participantes", assetId: "Movil o equipo", vehicleId: "Movil", leaderUserId: "Encargado", driverUserId: "Conductor", incidentId: "Intervencion",
 attendanceId: "Registro de ingreso", joinedAt: "Incorporacion al control", confirmations: "Confirmaciones registradas", confirmedAt: "Confirmacion", participatedAt: "Participacion",
 expectedQuantity: "Cantidad esperada", observedQuantity: "Cantidad encontrada", result: "Resultado", condition: "Condicion", resultingAssetStatus: "Estado resultante del movil",
 foundElsewhere: "Encontrado en otro lugar", foundLocation: "Ubicacion encontrada", observations: "Novedades", summaryOk: "Elementos correctos", summaryMissing: "Elementos faltantes",
 summaryDamaged: "Elementos deteriorados", summaryUnchecked: "Elementos sin revisar", inspectionId: "Control", draftId: "Borrador", inspectionDate: "Fecha del control", inspectionTime: "Hora del control",
 createdAt: "Fecha de registro", updatedAt: "Ultima modificacion", receivedAt: "Recepcion del aviso", cancelledAt: "Anulacion", cancelReason: "Motivo de anulacion", occurredOn: "Fecha del gasto",
 startedAt: "Inicio", endedAt: "Fin", departedAt: "Salida", arrivedAt: "Llegada", returnedAt: "Retorno", checkInAt: "Ingreso al cuartel", checkOutAt: "Salida del cuartel", workedMinutes: "Minutos registrados",
 completedAt: "Trabajo terminado", reviewedAt: "Revision realizada", reviewedByUserId: "Verificado por", dueOn: "Vencimiento de tarea", dueAt: "Plazo", priority: "Prioridad", responsibleUserId: "Responsable",
 volumeMilliliters: "Litros de combustible", liters: "Litros", odometer: "Odometro", startOdometer: "Odometro inicial", endOdometer: "Odometro final", destination: "Destino", customer: "Cliente", tripCount: "Cantidad de viajes",
 source: "Origen del aviso", phoneNumber: "Telefono de contacto", location: "Ubicacion", type: "Tipo", alertId: "Alerta", referral: "Derivacion", response: "Respuesta", period: "Turno", date: "Fecha",
 clothingBrand: "Marca", clothingModel: "Modelo", clothingSize: "Talle", clothingCondition: "Estado de prenda", clothingNovelties: "Novedades de prenda", category: "Categoria",
 body: "Texto", bodySnapshot: "Texto confirmado", contentHash: "Referencia de version", messageId: "Mensaje", isPinned: "Mensaje fijado", editedAt: "Edicion", deletedAt: "Baja",
 beforeUserIds: "Personal anterior", afterUserIds: "Personal nuevo", reasonCode: "Motivo", synthetic: "Dato sintetico", version: "Version", count: "Cantidad",
 operationKey: "Referencia de operacion", requestId: "Referencia de solicitud", entityType: "Tipo de registro", entityId: "Registro afectado", previousValidUntil: "Vencimiento anterior",
};
const values: Record<string, string> = {
 FLEET: "Responsable de flota", TECHNICAL: "Responsable tecnico", FINANCE: "Acceso financiero", ALL: "Todo el personal elegible", ACCEPTED: "Aceptado; pendiente de resolucion", OPENED: "Abierta", CLOSE: "Cerrar permanencia", REOPEN: "Reabrir permanencia",
 ADMIN: "Administracion", OPERATOR: "Suboficial", FIREFIGHTER: "Bombero o aspirante", GUARD: "Guardia", PERSONAL: "Personal",
 PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado", ASSIGNED: "Asignada", SUBMITTED: "Enviada para verificar", VERIFIED: "Verificada", RETURNED: "Devuelta", CANCELLED: "Cancelada",
 OPEN: "Abierto", CLOSED: "Cerrado", ACTIVE: "Activa", RESOLVED: "Resuelto", OPERATIONAL: "Operativo", MAINTENANCE: "En mantenimiento", OUT_OF_SERVICE: "Fuera de servicio",
 IN_PROGRESS: "En curso", OK: "En condiciones", REVIEW: "A revisar", DAMAGED: "Deteriorado", MISSING: "Faltante", UNCHECKED: "Sin revisar", HIGH: "Alta", MEDIUM: "Media", LOW: "Baja", NORMAL: "Normal", URGENT: "Urgente",
 GOING: "Asiste", NOT_GOING: "No asiste", DAY: "Diurno", NIGHT: "Nocturno", AVAILABLE: "Disponible", UNAVAILABLE: "No disponible", ON_CALL: "Localizable",
 FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", MEDICAL: "Emergencia medica", CHEMICAL: "Riesgo quimico", FLOOD: "Inundacion", OTHER: "Otro",
 GET: "Consulta", POST: "Registro de accion", PUT: "Actualizacion", PATCH: "Modificacion parcial", DELETE: "Baja o retiro",
 DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado", PROTOCOL: "Protocolo", SHIFT_REPORT: "Acta de guardia", INCIDENT_REPORT: "Acta de intervencion",
 CLOTHING: "Prendas", DRIVER_LICENSE: "Licencia de conducir", TRAINING: "Capacitacion", SERVICE: "Servicio", VEHICLE: "Movil", PPE: "Proteccion personal", NOTE: "Nota", PASS: "Aprobado", FAIL: "Rechazado",
 HELMET: "Casco", COAT: "Chaqueton", TROUSERS: "Pantalon", BOOTS: "Botas", GLOVES: "Guantes", HOOD: "Capucha",
};
export function auditDate(value: string) {
 if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split("-").reverse().join("/");
 const date = new Date(value);
 return Number.isNaN(+date) ? value : date.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}
export function auditMetadata(metadata: unknown): Array<{ label: string; value: string }> {
 const result: Array<{ label: string; value: string }> = [];
 const privateField = /^(password|passwordHash|refreshToken|accessToken|tokenHash|secret|bytes)$/i;
 function scalar(value: unknown, key: string) {
  if (value === null || value === undefined) return "Sin dato";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") {
   if (key.endsWith("Cents")) return (value / 100).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
   if (key === "volumeMilliliters") return (value / 1000).toLocaleString("es-AR") + " L";
   return value.toLocaleString("es-AR");
  }
  const text = String(value);
  if (["permission", "specialPermissions"].includes(key)) return ({FLEET:"Responsable de flota",PPE:"Responsable de EPP",TECHNICAL:"Responsable tecnico",FINANCE:"Acceso financiero"} as Record<string,string>)[text] || text;
  if (key === "scope") return text === "LOW" ? "Personal con puntaje bajo" : text === "ALL" ? "Todo el personal elegible" : text;
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(text)) return auditDate(text);
  if (key === "entityType") return auditEntity(text);
  if (key === "action") return text === "CLOSE" ? "Cerrar permanencia" : text === "OPEN" ? "Abrir permanencia" : auditAction(text);
  return /status|role|condition|priority|response|decision|result|type|period|category|method|mode/i.test(key) ? values[text] || text : text;
 }
 function walk(value: unknown, path: string[], key: string, depth: number) {
  if (depth > 16) { result.push({ label: path.join(" / "), value: "Detalle de profundidad adicional conservado en el registro original" }); return; }
  if (Array.isArray(value)) {
   if (!value.length) { result.push({ label: path.join(" / "), value: "Sin elementos" }); return; }
   value.forEach((item, index) => {
    if (item && typeof item === "object" && "field" in item) {
     const field = String(item.field);
     if (privateField.test(field)) return;
     walk(item.before, [...path, fields[field] || "Campo adicional", "Antes"], field, depth + 1);
     walk(item.after, [...path, fields[field] || "Campo adicional", "Despues"], field, depth + 1);
    } else walk(item, [...path, String(index + 1)], key, depth + 1);
   }); return;
  }
  if (value && typeof value === "object") {
   Object.entries(value).forEach(([field, entry]) => {
    if (privateField.test(field)) return;
    walk(entry, [...path, fields[field] || "Dato adicional"], field, depth + 1);
   }); return;
  }
  result.push({ label: path.join(" / ") || "Detalle", value: scalar(value, key) });
 }
 walk(metadata, [], "", 0);
 return result;
}
