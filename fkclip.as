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
    import flash.system.System;
 
    public class fkclip extends Sprite {
        
        private var id:String;
        
        public function fkclip():void {
            // constructor, setup event listeners and external interfaces
            
            // import flashvars
            var flashvars:Object = LoaderInfo(this.root.loaderInfo).parameters;
            id = flashvars.id;

            // invisible button covers entire stage
            var button:Sprite = new Sprite();
            button.graphics.beginFill(0xFF0000);
            button.alpha = 0.0;
            button.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
            button.graphics.endFill();
            button.x = 0;
            button.y = 0;
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
            ExternalInterface.call('fkclip_dispatch', id, 'loaded');
        }

        private function clickHandler(event:Event):void {
            System.setClipboard(String(ExternalInterface.call(
                    'fkclip_dispatch', id, 'click')));
            ExternalInterface.call('fkclip_dispatch', id, 'complete');
        }
    }
}
