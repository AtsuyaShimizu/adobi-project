-- Sample data for invite-based authentication

-- Insert invite records
INSERT INTO invites (email, expires_at, note, invited_by)
VALUES
('beta1@example.com', now() + interval '7 day', 'First batch', 'admin1'),
('beta2@example.com', now() + interval '7 day', 'Second batch', 'admin1'),
('beta3@example.com', now() - interval '1 day', 'Expired invite', 'admin2');

-- Simulate user signup for the first invite
INSERT INTO users (firebase_uid, email, invite_id, is_email_verified)
VALUES
('uid_001', 'beta1@example.com', 1, true);

-- Log actions
INSERT INTO auth_logs (email, action, invite_id, detail)
VALUES
('beta1@example.com', 'invite_sent', 1, 'Invitation email sent'),
('beta1@example.com', 'signup_allowed', 1, 'Signup allowed by blocking function'),
('beta3@example.com', 'signup_denied', 3, 'Invite expired'),
('beta1@example.com', 'signin_allowed', 1, 'Signin permitted'),
('beta3@example.com', 'signin_denied', 3, 'Invite expired');
