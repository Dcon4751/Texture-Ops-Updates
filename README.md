# Texture Ops Updates

Public updater metadata and server code for the Texture Ops Blender add-on.

## Vercel environment variables

Set these in the Vercel project:

- `TEXTURE_OPS_RELEASE_VERSION`
- `TEXTURE_OPS_RELEASE_URL`
- `TEXTURE_OPS_RELEASE_SHA256`

The download endpoint verifies the customer's Gumroad license before returning the configured release URL.

**Do not commit paid Texture Ops ZIP files, customer keys, or secrets to this repository.**
