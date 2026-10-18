package cloud.hellman.fimbulvetr;

import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;

/**
 * Gamepad and remote state for the web game. The Activity feeds it every controller event before the
 * WebView sees one, and the game polls {@link #state()} once per frame through the JavaScript interface
 * (see src/shell/platform/host.ts). Buttons use the W3C "standard" gamepad layout, so the game's own
 * bindings apply unchanged: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 10/11 sticks,
 * 12-15 d-pad.
 */
final class PadBridge {
    static final int A = 0;
    static final int START = 9;
    static final int UP = 12;
    static final int DOWN = 13;
    static final int LEFT = 14;
    static final int RIGHT = 15;
    private static final int LT = 6;
    private static final int RT = 7;

    /** Buttons held by key events. */
    private int keys;
    /** D-pad held through the hat axes (many pads report the d-pad as axes, not keys). */
    private int hat;
    /** Triggers held through their analogue axes. */
    private int triggers;
    private float ax;
    private float ay;

    /** True for events from a gamepad or joystick (not the TV remote's d-pad). */
    static boolean fromPad(int source) {
        return (source & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
                || (source & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
    }

    /** The standard-layout index for an Android key code, or -1 for keys the game does not use. */
    static int button(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BUTTON_A: return 0;
            case KeyEvent.KEYCODE_BUTTON_B: return 1;
            case KeyEvent.KEYCODE_BUTTON_X: return 2;
            case KeyEvent.KEYCODE_BUTTON_Y: return 3;
            case KeyEvent.KEYCODE_BUTTON_L1: return 4;
            case KeyEvent.KEYCODE_BUTTON_R1: return 5;
            case KeyEvent.KEYCODE_BUTTON_L2: return LT;
            case KeyEvent.KEYCODE_BUTTON_R2: return RT;
            case KeyEvent.KEYCODE_BUTTON_SELECT: return 8;
            case KeyEvent.KEYCODE_BUTTON_START: return START;
            case KeyEvent.KEYCODE_BUTTON_THUMBL: return 10;
            case KeyEvent.KEYCODE_BUTTON_THUMBR: return 11;
            case KeyEvent.KEYCODE_DPAD_UP: return UP;
            case KeyEvent.KEYCODE_DPAD_DOWN: return DOWN;
            case KeyEvent.KEYCODE_DPAD_LEFT: return LEFT;
            case KeyEvent.KEYCODE_DPAD_RIGHT: return RIGHT;
            case KeyEvent.KEYCODE_DPAD_CENTER: return A;
            default: return -1;
        }
    }

    /** Applies a pad key event. Returns false when the key is not a game button. */
    synchronized boolean key(KeyEvent e) {
        int b = button(e.getKeyCode());
        if (b < 0) return false;
        if (e.getAction() == KeyEvent.ACTION_DOWN) keys |= 1 << b;
        else if (e.getAction() == KeyEvent.ACTION_UP) keys &= ~(1 << b);
        return true;
    }

    /** Sets or clears one button directly (the remote's Back key holds Start). */
    synchronized void hold(int b, boolean down) {
        if (down) keys |= 1 << b;
        else keys &= ~(1 << b);
    }

    /** Applies a joystick motion event: left stick, hat d-pad and analogue triggers. */
    synchronized void motion(MotionEvent e) {
        ax = e.getAxisValue(MotionEvent.AXIS_X);
        ay = e.getAxisValue(MotionEvent.AXIS_Y);
        float hx = e.getAxisValue(MotionEvent.AXIS_HAT_X);
        float hy = e.getAxisValue(MotionEvent.AXIS_HAT_Y);
        hat = (hx < -0.5f ? 1 << LEFT : 0) | (hx > 0.5f ? 1 << RIGHT : 0)
                | (hy < -0.5f ? 1 << UP : 0) | (hy > 0.5f ? 1 << DOWN : 0);
        float lt = Math.max(e.getAxisValue(MotionEvent.AXIS_LTRIGGER), e.getAxisValue(MotionEvent.AXIS_BRAKE));
        float rt = Math.max(e.getAxisValue(MotionEvent.AXIS_RTRIGGER), e.getAxisValue(MotionEvent.AXIS_GAS));
        triggers = (lt > 0.5f ? 1 << LT : 0) | (rt > 0.5f ? 1 << RT : 0);
    }

    /** Lets go of everything (the app went to the background, so key-ups may never arrive). */
    synchronized void clear() {
        keys = 0;
        hat = 0;
        triggers = 0;
        ax = 0;
        ay = 0;
    }

    /** "buttons,ax,ay": the held-button bit mask and the left stick, read by the game every frame. */
    synchronized String state() {
        return (keys | hat | triggers) + "," + ax + "," + ay;
    }
}
