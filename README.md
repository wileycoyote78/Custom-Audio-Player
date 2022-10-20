# Custom-Audio-Player

This is my first contribution to the web. Better players have been made, I know. But if you're looking for something quick and dirty, or at least
as an example to teach your students what NOT to do, then you are very welcome!

I wrote up a custom audio player to interface with HTML5 audio elements. It requires jQuery in order to run. I did this, knowing others have already
made better looking ones, primarily because they still did not exactly look like what I wanted, and the night/day difference between the Webkit and
Mozilla versions of the native players is quite apalling. Secondly, I did it because I wanted to see if I could.

The CSS can be customized to change the layout and color schemes in any which way, if you want to take the time. 
I designed it to somewhat mirror Firefox's iteration of the audio element's controls embedded in the browser. I even managed to mimic the control's ability to hide elements when the thing gets too narrow, either by
resizing the screen, or if the player is embedded in a container that is too small.

I have set some custom properties in the stylesheet to control colors, which of course can be easily changed. Note that you will need to use the new
HSL method to define colors. For example, if you wanted to change the --player_active-color property.
[style.css]
`:root {
...
--player_active-color: 120 60% 40%;
...
}`

The above would change the color of the controls from the default blue to a greenish color.

If you have the know-how, you could expand (right, IMPROVE more like it) on what I've done to fit your needs.

DEFAULT DIMENSIONS of the container: Width: clamp(60px, 100%, 600px) / Height: 60px
FONT SIZE FOR EM units: clamp(9px, 1rem, 14px);

Audio can either be loaded thru an HTML <audio> element, or by using the 'audio' constant in JS. Note that if you will be using the HTML audio tag,
you need to set its ID to "player" for the JS script to find it. Of course, you can select a different ID and change the JS to look for that ID. In the
JS file, a global const variable named 'audio' is defined as either the HTML element, or a new instance of the Audio object if an HTML element cannot be
found. 

HTML Example:
<audio id="player" preload="none|metadata|auto">
  <source src="path/to/your/audio" />
</audio>

In 'script.js' if there is no <audio> element found, it sets const audio to 'new Audio().' So you can either edit script.js directly, or create another
js file and call the audio element from there; just make sure you have linked to the Custom Audio Player's js file in your HTML.
Javascript Example:
audio.src = "path/to/your/audio";
audio.load();
