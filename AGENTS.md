# AI development notes

- Preserve the baseline model: `IPD_x = C_x*dZ/dx`, `IPD_y = C_y*dZ/dy`.
- Never silently assume physical units from XYZ index coordinates.
- Treat raw `.xyz` metrology files as potentially proprietary; do not commit them to this public repo unless explicitly approved.
- Any scanner correction implementation must clearly distinguish generic research approximation from verified vendor behavior.
- Add tests whenever parser conventions, derivative logic, masking, or calibration behavior changes.
