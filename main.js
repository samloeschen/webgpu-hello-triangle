let device, context;

let vertexBuffer;
const vertexData = new Float32Array([
    0.0,  0.6, 0.0, 1.0, 
    1.0,  0.0, 0.0, 1.0,
   -0.5, -0.6, 0.0, 1.0, 
    0.0,  1.0, 0.0, 1.0,
    0.5, -0.6, 0.0, 1.0, 
    0.0,  0.0, 1.0, 1.0
]);
const vertexState = [{
    attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        },
        {
            shaderLocation: 1,
            offset: 16,
            format: 'float32x4',
        }
    ],
    arrayStride: 32,
    stepMode: 'vertex',
}]

let pipelineDescriptor, pipelineState;

async function main() {
    await initialize();
    draw();
}

async function initialize() {
    const adapter = await window.navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();

    const canvas = document.querySelector('#gpuCanvas');
    canvas.width = 600;
    canvas.height = 450;

    context = canvas.getContext('gpupresent');
    context.configure({
        device: device,
        format: 'bgra8unorm'
    });

    // set up vertex buffer
    vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    })
    let mappedBuffer = new Float32Array(vertexBuffer.getMappedRange());
    mappedBuffer.set(vertexData);
    vertexBuffer.unmap();

    // get shaders
    const shaderNode = document.querySelector('#shaders');
    const shaderModule = device.createShaderModule({
        code: shaderNode.textContent
    });

    // set up pipeline descriptor
    pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vert_main',
            buffers: vertexState,
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'frag_main',
            targets: [{
                format: 'bgra8unorm'
            }]
        },
        primitive: {
            topology: 'triangle-list'
        },
    }
    pipelineState = device.createRenderPipeline(pipelineDescriptor);
}

function draw() {
    const clearColor = { r: 0.0, g: 0.1, b: 0.25, a: 1.0 };
    const renderPassDescriptor = {
        colorAttachments: [{
            loadValue: clearColor,
            storeOp: 'store',
            view: context.getCurrentTexture().createView()
        }]
    };

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipelineState);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);
    passEncoder.endPass();
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(() => {
        draw();
    });
}

window.addEventListener('load', main);