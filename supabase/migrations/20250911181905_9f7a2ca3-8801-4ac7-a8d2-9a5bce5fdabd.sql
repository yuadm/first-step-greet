-- Create Medication Competency questionnaire and questions
INSERT INTO compliance_questionnaires (name, description, is_active)
VALUES ('Medication Competency Assessment', 'Assessment for medication administration competency', true)
ON CONFLICT (name) DO NOTHING;

-- Get the questionnaire ID
DO $$
DECLARE
    questionnaire_uuid UUID;
    question_uuid UUID;
BEGIN
    -- Get or create the questionnaire
    SELECT id INTO questionnaire_uuid FROM compliance_questionnaires WHERE name = 'Medication Competency Assessment';
    
    -- Create questions if they don't exist
    INSERT INTO compliance_questions (question_text, question_type, section, order_index, is_required, help_text)
    VALUES 
        ('Medication Knowledge: Demonstrate understanding of medication types, dosages, and administration methods', 'text', 'Competency Assessment', 1, true, 'Describe your knowledge of different medications and their proper administration'),
        ('Safe Practices: Show knowledge of safety protocols and infection control measures', 'text', 'Competency Assessment', 2, true, 'Explain the safety protocols you follow when administering medication'),
        ('Documentation: Demonstrate proper record-keeping and documentation practices', 'text', 'Competency Assessment', 3, true, 'Describe how you document medication administration'),
        ('Emergency Procedures: Knowledge of emergency response and adverse reaction protocols', 'text', 'Competency Assessment', 4, true, 'Explain what you would do in case of a medication emergency or adverse reaction'),
        ('Error Reporting: Understanding of medication error reporting procedures', 'text', 'Competency Assessment', 5, true, 'Describe the process for reporting medication errors'),
        ('Patient Rights: Knowledge of patient consent and medication rights', 'text', 'Competency Assessment', 6, true, 'Explain patient rights regarding medication administration'),
        ('Confidentiality: Understanding of patient confidentiality in medication management', 'text', 'Competency Assessment', 7, true, 'Describe how you maintain patient confidentiality'),
        ('Additional Comments: Any additional observations or notes', 'text', 'Additional Information', 8, false, 'Optional additional comments about the competency assessment')
    ON CONFLICT (question_text) DO NOTHING;
    
    -- Link questions to questionnaire
    FOR question_uuid IN 
        SELECT id FROM compliance_questions 
        WHERE question_text IN (
            'Medication Knowledge: Demonstrate understanding of medication types, dosages, and administration methods',
            'Safe Practices: Show knowledge of safety protocols and infection control measures',
            'Documentation: Demonstrate proper record-keeping and documentation practices',
            'Emergency Procedures: Knowledge of emergency response and adverse reaction protocols',
            'Error Reporting: Understanding of medication error reporting procedures',
            'Patient Rights: Knowledge of patient consent and medication rights',
            'Confidentiality: Understanding of patient confidentiality in medication management',
            'Additional Comments: Any additional observations or notes'
        )
        ORDER BY order_index
    LOOP
        INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
        SELECT questionnaire_uuid, question_uuid, (
            SELECT COALESCE(MAX(order_index), 0) + 1 
            FROM compliance_questionnaire_questions 
            WHERE questionnaire_id = questionnaire_uuid
        )
        ON CONFLICT (questionnaire_id, question_id) DO NOTHING;
    END LOOP;
    
    -- Link questionnaire to Medication Competency compliance type
    UPDATE compliance_types 
    SET questionnaire_id = questionnaire_uuid, has_questionnaire = true
    WHERE name ILIKE '%medication%competency%' OR name ILIKE '%medication%administration%';
    
END $$;