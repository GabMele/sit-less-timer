# TODO

- [ ] **Measure the cost of the redraw interval.** The dial is redrawn every 500 ms at the moment (it was 200 ms; 1 s was
  tried). Compare CPU time of the app's processes (timer.exe and its WebView2 children) over ~30 s with the timer running,
  at 200 ms, 500 ms and 1 s, then pick the final value. Look at battery impact on a laptop too, not only CPU %.
