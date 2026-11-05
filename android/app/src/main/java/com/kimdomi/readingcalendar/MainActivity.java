package com.kimdomi.readingcalendar;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReadingNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
