# Booking Workflow Documentation

## Overview
The booking system now follows a two-stage process where customers submit service requests and staff confirm them with final pricing and duration details.

## Customer Booking Process

1. **Service Selection**: Customers select services through the hierarchical service selector
2. **Date & Time**: Customers choose their preferred appointment date and time
3. **Details**: Customers provide their contact information and any special notes
4. **Loyalty Program**: Customers can optionally sign in/register for loyalty benefits
5. **Submission**: The booking is created with `status: "pending"` and `totalPrice: null`, `totalDuration: null`

## Staff Confirmation Process

### API Endpoint: `PATCH /api/bookings/:id/confirm`

**Authentication**: Requires staff authentication token

**Request Body**:
```json
{
  "totalPrice": 150.00,           // Required: Final price for the service
  "totalDuration": 120,           // Optional: Duration in minutes (if different from estimate)
  "notes": "Additional notes"     // Optional: Staff notes
}
```

**Response**:
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "id": "booking_id",
    "status": "confirmed",
    "totalPrice": 150.00,
    "totalDuration": 120,
    // ... other booking details
  }
}
```

## Database Changes

### Booking Creation
- `totalPrice`: Set to `null` (to be filled by staff)
- `totalDuration`: Set to `null` (to be filled by staff)
- `status`: Set to `"pending"`

### Booking Confirmation
- `totalPrice`: Updated with staff-provided price
- `totalDuration`: Updated with staff-provided duration (optional)
- `status`: Changed to `"confirmed"`
- `notes`: Updated with any additional staff notes

## Benefits of This Workflow

1. **Flexible Pricing**: Staff can provide custom quotes based on specific requirements
2. **Accurate Duration**: Staff can adjust duration based on service complexity
3. **Quality Control**: All bookings are reviewed before confirmation
4. **Customer Communication**: Staff can contact customers to discuss details before confirming
5. **Better Planning**: Staff have full control over scheduling and resource allocation

## Client-Side Changes

### UI Updates
- Service duration shows as "estimated"
- Clear messaging that staff will confirm final details
- Form submission creates "service request" rather than confirmed booking

### Form Submission
- Removed automatic duration calculation
- Removed price estimation
- Focus on gathering customer requirements and preferences

## Email Notifications

1. **Initial Submission**: Customer receives acknowledgment of service request
2. **Staff Confirmation**: Customer receives confirmation with final price and duration
3. **Booking Updates**: Any changes trigger notification emails

## Admin Dashboard Integration

Staff can view pending bookings and use the confirmation endpoint to:
- Set final pricing based on consultation
- Adjust duration based on service complexity
- Add notes about specific requirements
- Confirm the booking to finalize the appointment

This workflow ensures better customer service and more accurate scheduling while maintaining flexibility for both customers and staff.
