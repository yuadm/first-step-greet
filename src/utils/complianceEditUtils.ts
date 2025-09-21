/**
 * Utility functions for determining compliance record edit behavior
 * Ensures consistent editing experience across employee and client compliance
 */

export interface EditBehavior {
  shouldOpenFormDirectly: boolean;
  formType: 'annual_appraisal' | 'medication_competency' | 'supervision' | 'spotcheck' | 'client_spotcheck' | 'modal';
  reason: string;
}

/**
 * Determines how a compliance record should be edited based on its completion method
 * @param completionMethod The method used to complete the compliance record
 * @param complianceTypeName The name of the compliance type (for additional context)
 * @returns EditBehavior object indicating whether to open form directly or use modal
 */
export function getComplianceEditBehavior(
  completionMethod?: string, 
  complianceTypeName?: string
): EditBehavior {
  
  // Direct form editing for complex forms
  switch (completionMethod?.toLowerCase()) {
    case 'annual_appraisal':
      return {
        shouldOpenFormDirectly: true,
        formType: 'annual_appraisal',
        reason: 'Annual appraisal requires form editing'
      };
    
    case 'medication_competency':
    case 'questionnaire':
      // Check if it's medication competency based on compliance type name as well
      if (complianceTypeName?.toLowerCase().includes('medication')) {
        return {
          shouldOpenFormDirectly: true,
          formType: 'medication_competency',
          reason: 'Medication competency requires form editing'
        };
      }
      // For other questionnaire types, could expand here for future forms
      return {
        shouldOpenFormDirectly: false,
        formType: 'modal',
        reason: 'Generic questionnaire - use modal'
      };
    
    case 'supervision':
      return {
        shouldOpenFormDirectly: true,
        formType: 'supervision',
        reason: 'Supervision requires form editing'
      };
    
    case 'spotcheck':
      return {
        shouldOpenFormDirectly: true,
        formType: 'spotcheck',
        reason: 'Employee spot check requires form editing'
      };
    
    // Client spot checks (for client compliance)
    case 'client_spotcheck':
      return {
        shouldOpenFormDirectly: true,
        formType: 'client_spotcheck',
        reason: 'Client spot check requires form editing'
      };
    
    // Simple records that should use the modal
    case 'date_entry':
    case 'text_entry':
    case undefined:
    case null:
      return {
        shouldOpenFormDirectly: false,
        formType: 'modal',
        reason: 'Simple date/text entry - use modal'
      };
    
    default:
      // For unknown completion methods, default to modal for safety
      return {
        shouldOpenFormDirectly: false,
        formType: 'modal',
        reason: `Unknown completion method '${completionMethod}' - defaulting to modal`
      };
  }
}

/**
 * Checks if a compliance record has the "new" status (employee joined after period)
 */
export function isNewEmployeeRecord(record: any): boolean {
  return record?.status === 'new' || record?.completion_method === 'text_entry';
}

/**
 * Helper to determine if record has completed form data that can be edited
 */
export function hasEditableFormData(record: any): boolean {
  const behavior = getComplianceEditBehavior(record?.completion_method);
  return behavior.shouldOpenFormDirectly && (
    record?.form_data || 
    record?.notes || 
    record?.status === 'completed'
  );
}