-- Create questions for the medication competency questionnaire
-- First, let's find the questionnaire ID
DO $$
DECLARE
    questionnaire_uuid UUID;
    question_uuid UUID;
    order_idx INTEGER := 1;
BEGIN
    -- Get the Medication Competency Assessment questionnaire ID
    SELECT id INTO questionnaire_uuid 
    FROM compliance_questionnaires 
    WHERE name = 'Medication Competency Assessment';
    
    IF questionnaire_uuid IS NULL THEN
        RAISE EXCEPTION 'Medication Competency Assessment questionnaire not found';
    END IF;
    
    -- Insert all the competency framework questions
    
    -- 1. Infection Control Precautions
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section)
    VALUES ('Routinely applies standard precautions for infection control and any other relevant health and safety measures', 'yes_no', true, order_idx, 'Competency Assessment')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 2. Check MAR Records
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Checks all medication administration records are available, up to date, legible and understood', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 3. Report Discrepancies
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Reports any discrepancies, ambiguities, or omissions to the line manager', 'yes_no', true, order_idx, 'Competency Assessment', 'Specific incidents / possible questions / discussion')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 4. Read MAR Accurately
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Reads the medication administration record accurately, referring any illegible directions to the line manager before it is administered', 'yes_no', true, order_idx, 'Competency Assessment', 'Specific incidents / possible questions / discussion. Further information can be found in the medication Information leaflet.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 5. Check Recent Medication
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Checks that the individual has not taken any medication recently, and is aware of the appropriate timing of doses', 'yes_no', true, order_idx, 'Competency Assessment', 'Checks the administration record, confirms with the individual.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 6. Obtain Consent and Support
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Obtains the individual''s consent and offers information, support and reassurance throughout, in a manner which encourages their co-operation, and which is appropriate to their needs and concerns', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion with individual')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 7. Six Rights Check
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Checks the identity of the individual who is to receive the medication before it is administered, and selects, checks, and prepares correctly the medication according to the medication administration record. (The six rights) • The right person • The right medicine • The right dose • The right time • The right route • The right to refuse', 'yes_no', true, order_idx, 'Competency Assessment', 'Confidently and accurately: 1. Checks the individual''s name matches that on the pack and on the administration record. 2. Selects the medication, checking that the name on the pack matches that on the administration record. 3. Selects the correct dose, according to the pack and the administration record. 4. Selects the correct timing of the dose according to that on the pack and on the administration record 5. Selects the correct route of administration. 6. Is aware of the person''s right to refuse to take medication.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 8. Encourage Self-Management
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Assists the individual to be as self-managing as possible. Refers any problems or queries to the line manager', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion with individual')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 9. Preserve Privacy and Dignity
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Ensure the persons privacy and dignity is preserved at all times', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion with individual')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 10. Select Route and Prepare
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Selects the route for the administration of medication according to the care plan and the drug and prepares the individual appropriately', 'yes_no', true, order_idx, 'Competency Assessment', 'Offers a full glass of water with tablets and capsules. Ensures individual is sitting upright for oral medicines. Notes any special instructions, e.g. do not crush, allow to dissolve under the tongue etc.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 11. Safely Assist Medication
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Safely assists with the medication. • Following the written instructions and in line with legislation and local policies • In a way which minimizes pain, discomfort and trauma to the individual', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion with individual.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 12. Report Immediate Problems
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Reports any immediate problems appropriately', 'yes_no', true, order_idx, 'Competency Assessment', 'May include refusal, inability to take medication etc.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 13. Confirm Medication Taken
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Checks and confirms that the individual actually takes the medication', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 14. Monitor Adverse Effects
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Monitors the individual''s condition throughout, recognises any obvious adverse effects and takes the appropriate action without delay', 'yes_no', true, order_idx, 'Competency Assessment', 'Adverse effects may include swelling, skin rash, fainting / giddiness, constipation, drowsiness. Checks medication information leaflet.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 15. Accurate Documentation
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Clearly and accurately enters relevant information in the correct records', 'yes_no', true, order_idx, 'Competency Assessment', 'Accurately documents assistance given, doses refused or missed for other reasons')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 16. Maintain Medication Security
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Maintains security of medication throughout the process and returns it to the correct place for storage', 'yes_no', true, order_idx, 'Competency Assessment', 'Awareness of other people in the household, grandchildren, visitors etc. Attention to instructions to store in a fridge, etc.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 17. Monitor and Rotate Stocks
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Monitors and rotates stocks of medication, paying attention to appropriate storage conditions, and reports any discrepancies in stocks immediately to the relevant person (line manager)', 'yes_no', true, order_idx, 'Competency Assessment', 'Ensures one pack of a medicine is used before starting the next.')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 18. Dispose Expired Medication
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Disposes of out of date and part-used medication in accordance with legal and local requirements, with the permission of the client', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation / discussion')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    order_idx := order_idx + 1;
    
    -- 19. Return Records and Maintain Confidentiality
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section, help_text)
    VALUES ('Returns medication administration records to the agreed place for storage and always maintains the confidentiality of information relating to the individual', 'yes_no', true, order_idx, 'Competency Assessment', 'Direct observation')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    
    -- Add a signature question
    order_idx := order_idx + 1;
    INSERT INTO compliance_questions (question_text, question_type, is_required, order_index, section)
    VALUES ('Employee Signature', 'text', true, order_idx, 'Acknowledgement')
    RETURNING id INTO question_uuid;
    
    INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
    VALUES (questionnaire_uuid, question_uuid, order_idx);
    
    -- Link questionnaire to compliance type
    UPDATE compliance_types 
    SET questionnaire_id = questionnaire_uuid, has_questionnaire = true
    WHERE name ILIKE '%medication%competency%' OR name ILIKE '%medication%';
    
END $$;