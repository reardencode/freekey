package {
    // Flash component for jQuery fkclip plugin
    // Author: Brandon Smith
    // Adapted from ZeroClipboard by Joseph Huckaby
    
    import flash.display.Stage;
    import flash.display.Sprite;
    import flash.display.LoaderInfo;
    import flash.display.StageScaleMode;
    import flash.events.*;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.external.ExternalInterface;
    import flash.system.Security;
    import flash.utils.*;
    import flash.desktop.Clipboard;
    import flash.desktop.ClipboardFormats;
 
    public class fkclip extends Sprite {
        
        private var id:String;
        private var button:Sprite;
        private var text:String;
        
        public function fkclip():void {
            // constructor, setup event listeners and external interfaces
            
            // import flashvars
            var flashvars:Object = LoaderInfo(this.root.loaderInfo).parameters;
            id = flashvars.id;

            // invisible button covers entire stage
            button = new Sprite();
            button.alpha = 0.0;
            addChild(button);
            button.buttonMode = true;
            button.useHandCursor = Boolean(int(flashvars.handCursor));
            button.addEventListener(MouseEvent.CLICK, clickHandler);
            
            button.addEventListener(MouseEvent.MOUSE_OVER,
                function(event:Event):void {
                    ExternalInterface.call('fkclip_dispatch', id, 'over');
                }
            );
            button.addEventListener(MouseEvent.MOUSE_OUT,
                function(event:Event):void {
                    ExternalInterface.call('fkclip_dispatch', id, 'out');
                }
            );
            button.addEventListener(MouseEvent.MOUSE_DOWN,
                function(event:Event):void {
                    ExternalInterface.call('fkclip_dispatch', id, 'down');
                }
            );
            button.addEventListener(MouseEvent.MOUSE_UP,
                function(event:Event):void {
                    ExternalInterface.call('fkclip_dispatch', id, 'up');
                }
            );
            ExternalInterface.addCallback('clear', function():void{text='';});
            ExternalInterface.addCallback('redraw', redraw);
            redraw();

            ExternalInterface.call('fkclip_dispatch', id, 'loaded');
        }

        private function redraw():void {
            button.graphics.clear();
            button.graphics.beginFill(0xFF0000);
            button.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
            button.graphics.endFill();
        }

        private function getText():String { return text; }

        private function clickHandler(event:Event):void {
            text = ExternalInterface.call('fkclip_dispatch', id, 'click');
            Clipboard.generalClipboard.clear();
            Clipboard.generalClipboard.setDataHandler(
                    ClipboardFormats.TEXT_FORMAT, getText);
            Clipboard.generalClipboard.setDataHandler(
                    ClipboardFormats.HTML_FORMAT, getText);
        }
    }
}
