-- MediVault Sample Data for Testing
-- This script populates the database with test medicines and drug conflicts

USE medivault;

-- Sample Medicines
INSERT INTO Medicines (generic_name, brand_name, strength, dosage_form, manufacturer, price, quantity, is_restricted, description) VALUES
('Aspirin', 'Aspirin 500mg', '500mg', 'Tablet', 'Generic Pharma', 50.00, 100, FALSE, 'Pain reliever and fever reducer'),
('Ibuprofen', 'Ibuprofen 400mg', '400mg', 'Tablet', 'Generic Pharma', 75.00, 150, FALSE, 'Anti-inflammatory pain reliever'),
('Warfarin', 'Coumadin 5mg', '5mg', 'Tablet', 'Brand Pharma', 200.00, 50, TRUE, 'Blood thinner - prescription required'),
('Amoxicillin', 'Amoxil 500mg', '500mg', 'Capsule', 'Generic Pharma', 150.00, 200, TRUE, 'Antibiotic - prescription required'),
('Paracetamol', 'Paracetamol 500mg', '500mg', 'Tablet', 'Generic Pharma', 40.00, 300, FALSE, 'Mild pain reliever and antipyretic'),
('Metformin', 'Glucophage 500mg', '500mg', 'Tablet', 'Generic Pharma', 120.00, 80, TRUE, 'Diabetes medication - prescription required'),
('Lisinopril', 'Prinivil 10mg', '10mg', 'Tablet', 'Brand Pharma', 180.00, 60, TRUE, 'Blood pressure medication - prescription required'),
('Vitamin C', 'Vitamin C 1000mg', '1000mg', 'Tablet', 'Supplement Brand', 200.00, 500, FALSE, 'Immune booster supplement'),
('Omeprazole', 'Prilosec 20mg', '20mg', 'Capsule', 'Generic Pharma', 220.00, 100, TRUE, 'Acid reducer - prescription recommended'),
('Atorvastatin', 'Lipitor 20mg', '20mg', 'Tablet', 'Brand Pharma', 250.00, 70, TRUE, 'Cholesterol medication - prescription required');

-- Drug Conflicts
-- Aspirin conflicts
INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (1, 2, 'moderate', 'Combining Aspirin with Ibuprofen increases risk of GI bleeding', 'Use only one NSAID at a time');

-- Warfarin conflicts (blood thinner interactions)
INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (3, 1, 'severe', 'Warfarin + Aspirin significantly increases bleeding risk', 'Avoid combination; consult physician');

INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (3, 2, 'severe', 'Warfarin + Ibuprofen increases bleeding risk', 'Avoid combination; consult physician');

-- Amoxicillin with other drugs
INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (4, 3, 'moderate', 'Amoxicillin may reduce Warfarin effectiveness', 'Monitor INR levels closely');

-- Metformin conflicts
INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (6, 7, 'mild', 'Metformin with ACE inhibitors may cause hypoglycemia', 'Monitor blood glucose regularly');

-- Omeprazole conflicts
INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
VALUES (9, 4, 'moderate', 'Omeprazole reduces antibiotic absorption', 'Space doses 2 hours apart');

-- Verify inserts
SELECT COUNT(*) as medicine_count FROM Medicines;
SELECT COUNT(*) as conflict_count FROM DrugConflicts;
SELECT * FROM Medicines LIMIT 5;
SELECT * FROM DrugConflicts LIMIT 5;
