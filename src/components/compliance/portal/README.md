# Investment Offerings Feature

## Overview
The Investment Offerings feature provides investors with a curated view of available investment opportunities. It displays projects that are open for investment and their associated public documents.

## Components

### OfferingsPage
The main container component that fetches and displays all available offerings. It handles:
- Fetching projects with `investment_status = 'Open'`
- Fetching public documents for each project (`is_public = TRUE`)
- Loading states and error handling
- Rendering the grid of offering cards

### OfferingCard
Individual card component displaying summarized information about an investment opportunity:
- Project name and type
- Location (jurisdiction)
- Minimum investment amount
- Target return percentage
- Investment term
- Brief description
- "View Details" button to open the detailed view

### OfferingDetailsDialog
Modal dialog showing comprehensive information about an offering:
- Complete project details
- List of available public documents with download/view options
- Additional project information
- "Register Interest" button for investor actions

## Data Sources
- Project data comes from the `projects` table
- Document data comes from the `issuer_detail_documents` table
- Only shows projects where `investment_status = 'Open'`
- Only shows documents where `is_public = TRUE`

## Routing
- The offerings page is accessible at `/offerings`
- Added to the main navigation sidebar

## Future Enhancements
- Filtering options by project type, minimum investment, etc.
- Sorting options
- Investor registration workflow
- Saved/favorited offerings
- Notifications for new offerings
- Direct investment functionality