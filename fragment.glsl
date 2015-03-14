precision highp float;

uniform vec2 uScreenResolution;
uniform vec2 uRealLimits;
uniform vec2 uImaginaryLimits;
uniform int uNumColours;
uniform float uWeight;
uniform vec4 uSetColour;
uniform vec4 uColours[10];

void main(void) {
    bool runaway = false;
    const int iterMax = 256;
    float x0 = uRealLimits.x + (uRealLimits.y - uRealLimits.x) * (gl_FragCoord.x / uScreenResolution.x);
    float y0 = uImaginaryLimits.x + (uImaginaryLimits.y - uImaginaryLimits.x) * (gl_FragCoord.y / uScreenResolution.y);
    float x = 0.0;
    float y = 0.0;
    float x2 = 0.0;
    float y2 = 0.0;
    float temp;
    float N;

    // test for cardoid or period-2 bulb
    float q = (x0 - 0.25) * (x0 - 0.25) + y0 * y0;
    if(q * (q + (x0 - 0.25)) < 0.25 * y * y) {
        gl_FragColor = uSetColour;
    } else if(((x0 + 1.0) * (x0 + 1.0) + y0 * y0) <= 0.0625) {
        gl_FragColor = uSetColour;

    // do escape algorithm
    } else {
        for(int i = 0; i < iterMax; i++) {
            x2 = x*x;
            y2 = y*y;
            temp = x2 - y2 + x0;
            y = 2.0*x*y + y0;
            x = temp;
            if((x2 + y2) > 64.0) {
                runaway = true;
                N = float(i);
                break;
            }
        }

        if(runaway) {
            float smooth = N - log(log(sqrt(x2 + y2))) / 0.69314718056;
            smooth /= float(iterMax);
            smooth = pow(smooth, uWeight);
            float period = (1.0 - smooth) * float(uNumColours) - 1.0;
            if(period < 1.0) {
                gl_FragColor = (1.0 - period) * uColours[0] + period * uColours[1];
            } else if(period < 2.0) {
                gl_FragColor = (2.0 - period) * uColours[1] + (period - 1.0) * uColours[2];
            } else if(period < 3.0) {
                gl_FragColor = (3.0 - period) * uColours[2] + (period - 2.0) * uColours[3];
            } else if(period < 4.0) {
                gl_FragColor = (4.0 - period) * uColours[3] + (period - 3.0) * uColours[4];
            } else if(period < 5.0) {
                gl_FragColor = (5.0 - period) * uColours[4] + (period - 4.0) * uColours[5];
            } else if(period < 6.0) {
                gl_FragColor = (6.0 - period) * uColours[5] + (period - 5.0) * uColours[6];
            } else if(period < 7.0) {
                gl_FragColor = (7.0 - period) * uColours[6] + (period - 6.0) * uColours[7];
            } else if(period < 8.0) {
                gl_FragColor = (8.0 - period) * uColours[7] + (period - 7.0) * uColours[8];
            } else if(period < 9.0) {
                gl_FragColor = (9.0 - period) * uColours[8] + (period - 8.0) * uColours[9];
            }
        } else {
            gl_FragColor = uSetColour;
        }
    }
}
