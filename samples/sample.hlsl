// Preview project colors.
float4 main(float4 position : SV_POSITION) : SV_TARGET {
    if (position.x > 0.0) {
        return float4(0.5, 0.7, 0.9, 1.0);
    }
    return float4(0.0, 0.0, 0.0, 1.0);
}
