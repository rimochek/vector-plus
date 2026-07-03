# Closed beta smoke tests

## Tutor path

- [ ] Register as tutor
- [ ] Complete onboarding
- [ ] Upload avatar
- [ ] Upload verification documents
- [ ] Submit application
- [ ] Confirm tutor is **not** visible before approval
- [ ] Admin reviews documents
- [ ] Admin approves tutor
- [ ] Confirm tutor appears in search
- [ ] Confirm tutor can receive a booking
- [ ] Reject another test tutor
- [ ] Confirm rejection reason is visible on tutor dashboard
- [ ] Edit and resubmit rejected profile

## Student path

- [ ] Register as student
- [ ] Complete onboarding
- [ ] Search by subject
- [ ] Filter by price
- [ ] Filter by teaching format (online / in-person / both)
- [ ] Open tutor profile
- [ ] Favorite tutor
- [ ] Request a lesson
- [ ] Tutor approves lesson
- [ ] Exchange chat messages
- [ ] Cancel a test booking
- [ ] Confirm notifications appear

## Guest path

- [ ] Open `/tutors`
- [ ] Use landing navigation
- [ ] Open tutor profile
- [ ] Try Book session → `/signup/student`
- [ ] Try Message tutor → `/signup/student`
- [ ] Confirm redirect back to tutor after signup when `returnTo` is set
- [ ] Confirm no redirect loops

## Production path

- [ ] Refresh session after browser reload
- [ ] Test Google Sign-In
- [ ] Upload and delete avatar
- [ ] Upload and securely view verification document (admin)
- [ ] Test mobile widths
- [ ] Confirm no horizontal overflow
- [ ] Confirm HTTPS API calls
- [ ] Confirm no localhost URLs in production bundle
- [ ] Confirm Terms and Privacy links work
- [ ] Confirm unfinished payment actions are hidden / direct-payment copy shown

## Automated backend tests

```bash
cd backend && npm test
```

Covers teaching format matching, admin controller wiring, and related unit tests.
