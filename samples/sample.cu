// Preview project values on the GPU.
__global__ void scale(float* values, int count) {
    int index = blockIdx.x * blockDim.x + threadIdx.x;
    if (index < count) values[index] *= 2.0f;
}
const char* label = "eenei";
