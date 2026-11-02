Shader "eenei/Preview" {
    // Preview project colors.
    Properties { _Color ("Preview color", Color) = (1, 1, 1, 1) }
    SubShader {
        Pass {
            HLSLPROGRAM
            float4 fragment() : SV_Target { return float4(1, 1, 1, 1); }
            ENDHLSL
        }
    }
}
