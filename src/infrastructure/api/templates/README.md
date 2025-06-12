# Templates API

This directory contains the API endpoints for managing token templates in the system.

## Endpoints

### `GET /api/infrastructure/templates/list`

Lists template files in a category directory.

**Query Parameters:**
- `category` (required): The template category (simple, detailed, standard, custom)
- `standard` (required): The token standard (ERC20, ERC721, etc.)

### `GET /api/infrastructure/templates/get`

Gets a specific template's content.

**Query Parameters:**
- `path` (required): The template path in the format `category/filename.json`

### `POST /api/infrastructure/templates/upload`

Uploads a new template.

**Request Body:**
- `content` (required): The template JSON content as a string
- `category` (required): The template category (simple, detailed, standard, custom)
- `filename` (required): The filename for the template (should include .json extension)
- `projectId` (optional): The project ID to associate with the template

## Migration Notes

This API has been moved from `/api/templates/` to `/api/infrastructure/templates/` to follow the proper architectural structure.
The old endpoints remain available for backward compatibility but will be deprecated in the future.

## Implementation Notes

Templates are stored both:
1. As files in the `src/components/tokens/templates/{category}` directory
2. In the Supabase `token_templates` table as a fallback

This dual storage approach ensures maximum compatibility across environments. 