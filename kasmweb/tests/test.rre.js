const expect = chai.expect;

import Websock from '../core/websock.js';
import Display from '../core/display.js';

import RREDecoder from '../core/decoders/rre.js';

import FakeWebSocket from './fake.websocket.js';

function testDecodeRect(decoder, x, y, width, height, data, display, depth) {
    let sock;

    sock = new Websock;
    sock.open("ws://example.com");

    sock.on('message', () => {
        decoder.decodeRect(x, y, width, height, sock, display, depth);
    });

    sock._websocket._receiveData(new Uint8Array(data));

    display.flip();
}

function push16(arr, num) {
    arr.push((num >> 8) & 0xFF,
             num & 0xFF);
}

function push32(arr, num) {
    arr.push((num >> 24) & 0xFF,
             (num >> 16) & 0xFF,
             (num >>  8) & 0xFF,
             num & 0xFF);
}

describe('RRE Decoder', function () {
    let decoder;
    let display;

    before(FakeWebSocket.replace);
    after(FakeWebSocket.restore);

    beforeEach(function () {
        decoder = new RREDecoder();
        display = new Display(document.createElement('canvas'));
        display.resize(4, 4);
    });

    // TODO(directxman12): test rre_chunk_sz?

    it('should handle the RRE encoding', function () {
        let data = [];
        push32(data, 2); // 2 subrects
        push32(data, 0xff00ff); // becomes 00ff00ff --> #00FF00 bg color
        data.push(0xff); // becomes ff0000ff --> #0000FF color
        data.push(0x00);
        data.push(0x00);
        data.push(0xff);
        push16(data, 0); // x: 0
        push16(data, 0); // y: 0
        push16(data, 2); // width: 2
        push16(data, 2); // height: 2
        data.push(0xff); // becomes ff0000ff --> #0000FF color
        data.push(0x00);
        data.push(0x00);
        data.push(0xff);
        push16(data, 2); // x: 2
        push16(data, 2); // y: 2
        push16(data, 2); // width: 2
        push16(data, 2); // height: 2

        testDecodeRect(decoder, 0, 0, 4, 4, data, display, 24);

        let targetData = new Uint8Array([
            0x00, 0x00, 0xff, 255, 0x00, 0x00, 0xff, 255, 0x00, 0xff, 0x00, 255, 0x00, 0xff, 0x00, 255,
            0x00, 0x00, 0xff, 255, 0x00, 0x00, 0xff, 255, 0x00, 0xff, 0x00, 255, 0x00, 0xff, 0x00, 255,
            0x00, 0xff, 0x00, 255, 0x00, 0xff, 0x00, 255, 0x00, 0x00, 0xff, 255, 0x00, 0x00, 0xff, 255,
            0x00, 0xff, 0x00, 255, 0x00, 0xff, 0x00, 255, 0x00, 0x00, 0xff, 255, 0x00, 0x00, 0xff, 255
        ]);

        expect(display).to.have.displayed(targetData);
    });
});
