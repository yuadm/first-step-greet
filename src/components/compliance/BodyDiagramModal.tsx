import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Canvas as FabricCanvas, Circle, FabricText, FabricImage, Rect } from "fabric";

// Body part regions with their names and approximate click areas (adjusted for dual-view body diagram)
// Front view on the left, back view on the right
const BODY_PARTS = [
  // Front view (left side)
  { name: "Head (Front)", x: 200, y: 60, region: { minX: 170, maxX: 230, minY: 30, maxY: 90 } },
  { name: "Neck (Front)", x: 200, y: 100, region: { minX: 185, maxX: 215, minY: 90, maxY: 120 } },
  { name: "Left Shoulder (Front)", x: 160, y: 130, region: { minX: 140, maxX: 180, minY: 115, maxY: 150 } },
  { name: "Right Shoulder (Front)", x: 240, y: 130, region: { minX: 220, maxX: 260, minY: 115, maxY: 150 } },
  { name: "Left Upper Arm (Front)", x: 130, y: 180, region: { minX: 110, maxX: 150, minY: 150, maxY: 210 } },
  { name: "Right Upper Arm (Front)", x: 270, y: 180, region: { minX: 250, maxX: 290, minY: 150, maxY: 210 } },
  { name: "Chest", x: 200, y: 165, region: { minX: 175, maxX: 225, minY: 145, maxY: 195 } },
  { name: "Abdomen", x: 200, y: 215, region: { minX: 175, maxX: 225, minY: 195, maxY: 245 } },
  { name: "Left Forearm (Front)", x: 110, y: 240, region: { minX: 90, maxX: 135, minY: 210, maxY: 270 } },
  { name: "Right Forearm (Front)", x: 290, y: 240, region: { minX: 265, maxX: 310, minY: 210, maxY: 270 } },
  { name: "Left Hand (Front)", x: 95, y: 285, region: { minX: 75, maxX: 120, minY: 270, maxY: 310 } },
  { name: "Right Hand (Front)", x: 305, y: 285, region: { minX: 285, maxX: 325, minY: 270, maxY: 310 } },
  { name: "Left Hip (Front)", x: 180, y: 260, region: { minX: 165, maxX: 195, minY: 245, maxY: 280 } },
  { name: "Right Hip (Front)", x: 220, y: 260, region: { minX: 205, maxX: 235, minY: 245, maxY: 280 } },
  { name: "Left Thigh (Front)", x: 175, y: 330, region: { minX: 160, maxX: 195, minY: 280, maxY: 380 } },
  { name: "Right Thigh (Front)", x: 225, y: 330, region: { minX: 205, maxX: 240, minY: 280, maxY: 380 } },
  { name: "Left Knee (Front)", x: 175, y: 395, region: { minX: 160, maxX: 195, minY: 380, maxY: 420 } },
  { name: "Right Knee (Front)", x: 225, y: 395, region: { minX: 205, maxX: 240, minY: 380, maxY: 420 } },
  { name: "Left Shin (Front)", x: 175, y: 460, region: { minX: 160, maxX: 195, minY: 420, maxY: 495 } },
  { name: "Right Shin (Front)", x: 225, y: 460, region: { minX: 205, maxX: 240, minY: 420, maxY: 495 } },
  { name: "Left Foot (Front)", x: 175, y: 515, region: { minX: 155, maxX: 195, minY: 495, maxY: 540 } },
  { name: "Right Foot (Front)", x: 225, y: 515, region: { minX: 205, maxX: 245, minY: 495, maxY: 540 } },
  
  // Back view (right side)
  { name: "Head (Back)", x: 600, y: 60, region: { minX: 570, maxX: 630, minY: 30, maxY: 90 } },
  { name: "Neck (Back)", x: 600, y: 100, region: { minX: 585, maxX: 615, minY: 90, maxY: 120 } },
  { name: "Left Shoulder (Back)", x: 560, y: 130, region: { minX: 540, maxX: 580, minY: 115, maxY: 150 } },
  { name: "Right Shoulder (Back)", x: 640, y: 130, region: { minX: 620, maxX: 660, minY: 115, maxY: 150 } },
  { name: "Left Upper Arm (Back)", x: 530, y: 180, region: { minX: 510, maxX: 550, minY: 150, maxY: 210 } },
  { name: "Right Upper Arm (Back)", x: 670, y: 180, region: { minX: 650, maxX: 690, minY: 150, maxY: 210 } },
  { name: "Upper Back", x: 600, y: 165, region: { minX: 575, maxX: 625, minY: 145, maxY: 195 } },
  { name: "Lower Back", x: 600, y: 215, region: { minX: 575, maxX: 625, minY: 195, maxY: 245 } },
  { name: "Left Forearm (Back)", x: 510, y: 240, region: { minX: 490, maxX: 535, minY: 210, maxY: 270 } },
  { name: "Right Forearm (Back)", x: 690, y: 240, region: { minX: 665, maxX: 710, minY: 210, maxY: 270 } },
  { name: "Left Hand (Back)", x: 495, y: 285, region: { minX: 475, maxX: 520, minY: 270, maxY: 310 } },
  { name: "Right Hand (Back)", x: 705, y: 285, region: { minX: 685, maxX: 725, minY: 270, maxY: 310 } },
  { name: "Left Buttock", x: 580, y: 260, region: { minX: 565, maxX: 595, minY: 245, maxY: 280 } },
  { name: "Right Buttock", x: 620, y: 260, region: { minX: 605, maxX: 635, minY: 245, maxY: 280 } },
  { name: "Left Thigh (Back)", x: 575, y: 330, region: { minX: 560, maxX: 595, minY: 280, maxY: 380 } },
  { name: "Right Thigh (Back)", x: 625, y: 330, region: { minX: 605, maxX: 640, minY: 280, maxY: 380 } },
  { name: "Left Knee (Back)", x: 575, y: 395, region: { minX: 560, maxX: 595, minY: 380, maxY: 420 } },
  { name: "Right Knee (Back)", x: 625, y: 395, region: { minX: 605, maxX: 640, minY: 380, maxY: 420 } },
  { name: "Left Calf", x: 575, y: 460, region: { minX: 560, maxX: 595, minY: 420, maxY: 495 } },
  { name: "Right Calf", x: 625, y: 460, region: { minX: 605, maxX: 640, minY: 420, maxY: 495 } },
  { name: "Left Foot (Back)", x: 575, y: 515, region: { minX: 555, maxX: 595, minY: 495, maxY: 540 } },
  { name: "Right Foot (Back)", x: 625, y: 515, region: { minX: 605, maxX: 645, minY: 495, maxY: 540 } },
];

interface BodyMarker {
  x: number;
  y: number;
  bodyPart: string;
}

interface BodyDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (markers: BodyMarker[]) => void;
  title: string;
  initialMarkers?: BodyMarker[];
}

export default function BodyDiagramModal({ 
  open, 
  onOpenChange, 
  onSave, 
  title, 
  initialMarkers = [] 
}: BodyDiagramModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [markers, setMarkers] = useState<BodyMarker[]>(initialMarkers);

  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 550,
      backgroundColor: "#ffffff",
    });

    // Load the body diagram image
    const loadBodyDiagram = async () => {
      try {
        console.log('Loading body diagram from /body-diagram.png');
        
        FabricImage.fromURL('/body-diagram.png', {
          crossOrigin: 'anonymous'
        }).then((img) => {
          console.log('Image loaded successfully', img.width, img.height);
          
          // Scale the image to fit the canvas
          const scale = Math.min(
            canvas.width! / img.width!,
            canvas.height! / img.height!
          );
          
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
          });
          
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
          
          console.log('Image added to canvas');
          
          // Add initial markers after the image is loaded
          initialMarkers.forEach(marker => {
            addMarkerToCanvas(canvas, marker.x, marker.y, marker.bodyPart);
          });
        }).catch((error) => {
          console.error('Failed to load body diagram:', error);
          drawFallbackBodyOutline(canvas);
          
          // Add initial markers
          initialMarkers.forEach(marker => {
            addMarkerToCanvas(canvas, marker.x, marker.y, marker.bodyPart);
          });
        });
      } catch (error) {
        console.error('Error loading body diagram:', error);
        drawFallbackBodyOutline(canvas);
        
        // Add initial markers
        initialMarkers.forEach(marker => {
          addMarkerToCanvas(canvas, marker.x, marker.y, marker.bodyPart);
        });
      }
    };

    const drawFallbackBodyOutline = (canvas: FabricCanvas) => {
      console.log('Drawing fallback body outline');
      
      // Front view (left side)
      // Head
      canvas.add(new Circle({ 
        left: 185, top: 45, radius: 25, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Body
      canvas.add(new Rect({ 
        left: 175, top: 100, width: 50, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Arms
      canvas.add(new Rect({ 
        left: 130, top: 120, width: 40, height: 80, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      canvas.add(new Rect({ 
        left: 230, top: 120, width: 40, height: 80, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Legs
      canvas.add(new Rect({ 
        left: 170, top: 210, width: 20, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      canvas.add(new Rect({ 
        left: 210, top: 210, width: 20, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      
      // Back view (right side)
      // Head
      canvas.add(new Circle({ 
        left: 585, top: 45, radius: 25, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Body
      canvas.add(new Rect({ 
        left: 575, top: 100, width: 50, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Arms
      canvas.add(new Rect({ 
        left: 530, top: 120, width: 40, height: 80, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      canvas.add(new Rect({ 
        left: 630, top: 120, width: 40, height: 80, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      // Legs
      canvas.add(new Rect({ 
        left: 570, top: 210, width: 20, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      canvas.add(new Rect({ 
        left: 610, top: 210, width: 20, height: 100, 
        fill: "transparent", stroke: "#666", strokeWidth: 2, 
        selectable: false, evented: false 
      }));
      
      canvas.renderAll();
    };

    canvas.on('mouse:down', (e) => {
      const pointer = canvas.getPointer(e.e);
      const clickedBodyPart = getBodyPartAtPosition(pointer.x, pointer.y);
      
      if (clickedBodyPart) {
        addMarker(pointer.x, pointer.y, clickedBodyPart);
      }
    });

    loadBodyDiagram();
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [open]);

  const getBodyPartAtPosition = (x: number, y: number): string | null => {
    for (const part of BODY_PARTS) {
      const { region } = part;
      if (x >= region.minX && x <= region.maxX && y >= region.minY && y <= region.maxY) {
        return part.name;
      }
    }
    return null;
  };

  const addMarkerToCanvas = (canvas: FabricCanvas, x: number, y: number, bodyPart: string) => {
    // Red circle marker
    const marker = new Circle({
      left: x - 8,
      top: y - 8,
      radius: 8,
      fill: "#dc2626",
      stroke: "#ffffff",
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
    });

    // Body part label
    const label = new FabricText(bodyPart, {
      left: x + 15,
      top: y - 10,
      fontSize: 12,
      fill: "#333",
      selectable: true,
      hasControls: false,
      hasBorders: false,
    });

    canvas.add(marker, label);
    canvas.renderAll();
  };

  const addMarker = (x: number, y: number, bodyPart: string) => {
    // Check if marker already exists for this body part
    const existingIndex = markers.findIndex(m => m.bodyPart === bodyPart);
    
    if (existingIndex >= 0) {
      // Remove existing marker
      setMarkers(prev => prev.filter((_, i) => i !== existingIndex));
      
      // Remove existing marker from canvas
      if (fabricCanvas) {
        const objects = fabricCanvas.getObjects();
        const toRemove = objects.filter(obj => 
          (obj.type === 'circle' && obj.fill === '#dc2626') || // markers
          obj.type === 'text' // labels
        );
        
        toRemove.forEach(obj => fabricCanvas.remove(obj));
        fabricCanvas.renderAll();
        
        // Redraw all markers except the one being replaced
        markers.filter((_, i) => i !== existingIndex).forEach(marker => {
          addMarkerToCanvas(fabricCanvas, marker.x, marker.y, marker.bodyPart);
        });
      }
    }

    // Add new marker
    const newMarker = { x, y, bodyPart };
    setMarkers(prev => [...prev.filter(m => m.bodyPart !== bodyPart), newMarker]);
    
    if (fabricCanvas) {
      addMarkerToCanvas(fabricCanvas, x, y, bodyPart);
    }
  };

  const handleSave = () => {
    onSave(markers);
    onOpenChange(false);
  };

  const handleClear = () => {
    setMarkers([]);
    if (fabricCanvas) {
      // Remove only markers and labels, keep the body diagram
      const objects = fabricCanvas.getObjects();
      const toRemove = objects.filter(obj => 
        obj.type === 'circle' && obj.fill === '#dc2626' || // markers
        obj.type === 'text' // labels
      );
      
      toRemove.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.renderAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on the body diagram to mark locations. Click again to remove a marker.
          </p>
          
          <div className="flex justify-center border rounded-lg p-4 bg-muted/5">
            <canvas 
              ref={canvasRef}
              className="border border-border rounded"
            />
          </div>
          
          {markers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Marked Locations:</h4>
              <div className="flex flex-wrap gap-2">
                {markers.map((marker, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive"
                  >
                    {marker.bodyPart}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Locations
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}