import { useState, useEffect, useRef } from 'react';
import { Story } from 'inkjs';
import storyContent from './story.json';
import { generateTavern, generateMonster, generateSword } from './lib/generator';
import { Card, CardContent, } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function App() {
  const [story, setStory] = useState<any>(null);
  const [currentText, setCurrentText] = useState<string[]>([]);
  const [choices, setChoices] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inkStory = new Story(storyContent);

    // Bind external functions
    inkStory.BindExternalFunction("generate_element", (type: string) => {
        if (type === "tavern") return generateTavern();
        if (type === "monster") return generateMonster();
        if (type === "sword") return generateSword();
        return "Unknown Element";
    });

    inkStory.BindExternalFunction("trigger_webhook", (payloadKey: string) => {
        let payloadData = {};
        if (payloadKey === "game_over") {
            payloadData = { status: "Game Over", reason: "Defeated by monster" };
        } else if (payloadKey === "victory") {
            payloadData = { status: "Victory", weapon_used: "legendary" };
        } else if (payloadKey === "cowardice") {
            payloadData = { status: "Cowardice", reason: "Fled from battle" };
        }

        console.log("Triggering Webhook:", payloadData);
        fetch('https://maker.ifttt.com/trigger/jules_payload/json/with/key/dl5-sKV4gjrTkSiX5s93-N', {
            method: 'POST',
            mode: 'no-cors', // IFTTT might block browser requests, using no-cors as fire-and-forget
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadData)
        }).then(() => console.log('Webhook requested'))
          .catch(e => console.error('Webhook error:', e));
    });

    setStory(inkStory);
  }, []);

  useEffect(() => {
    if (story) {
        continueStory();
    }
  }, [story]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentText, choices]);

  const continueStory = () => {
    if (!story) return;

    let textArr: string[] = [...currentText];

    while (story.canContinue) {
      let paragraphText = story.Continue();
      if (paragraphText && paragraphText.trim()) {
        textArr.push(paragraphText);
      }
    }

    setCurrentText(textArr);

    if (story.currentChoices.length > 0) {
        setChoices(story.currentChoices);
    } else {
        setChoices([]);
        setGameOver(true);
    }
  };

  const handleChoice = (choiceIndex: number) => {
    if (!story) return;

    // Add choice text to log
    const choiceText = story.currentChoices[choiceIndex].text;
    setCurrentText(prev => [...prev, `> ${choiceText}`]);

    story.ChooseChoiceIndex(choiceIndex);
    continueStory();
  };

  const restartGame = () => {
    setCurrentText([]);
    setChoices([]);
    setGameOver(false);

    const newStory = new Story(storyContent);
    // Need to rebind since it's a new instance
    newStory.BindExternalFunction("generate_element", (type: string) => {
        if (type === "tavern") return generateTavern();
        if (type === "monster") return generateMonster();
        if (type === "sword") return generateSword();
        return "Unknown Element";
    });
    newStory.BindExternalFunction("trigger_webhook", (payloadKey: string) => {
        let payloadData = {};
        if (payloadKey === "game_over") {
            payloadData = { status: "Game Over", reason: "Defeated by monster" };
        } else if (payloadKey === "victory") {
            payloadData = { status: "Victory", weapon_used: "legendary" };
        } else if (payloadKey === "cowardice") {
            payloadData = { status: "Cowardice", reason: "Fled from battle" };
        }
        fetch('https://maker.ifttt.com/trigger/jules_payload/json/with/key/dl5-sKV4gjrTkSiX5s93-N', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadData)
        });
    });

    setStory(newStory);
  };

  if (!story) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 py-12 md:py-24">
        <div className="max-w-2xl w-full">
            <h1 className="text-4xl font-bold text-center mb-8 text-amber-500 font-serif tracking-widest">TALES OF SANCTUM</h1>

            <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardContent className="p-6">
                    <div className="space-y-4 mb-8 min-h-[300px]">
                        {currentText.map((text, idx) => (
                            <p key={idx} className={`leading-relaxed ${text.startsWith('>') ? 'text-amber-400 italic mt-6' : 'text-slate-300'}`}>
                                {text}
                            </p>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    <div className="flex flex-col gap-3">
                        {choices.map((choice, idx) => (
                            <Button
                                key={idx}
                                variant="outline"
                                className="w-full justify-start h-auto whitespace-normal text-left py-3 px-4 border-slate-600 hover:bg-slate-700 hover:text-white"
                                onClick={() => handleChoice(idx)}
                            >
                                {choice.text}
                            </Button>
                        ))}

                        {gameOver && (
                            <div className="pt-8 text-center border-t border-slate-700 mt-4">
                                <h3 className="text-xl font-bold mb-4 text-slate-400">The End</h3>
                                <Button
                                    onClick={restartGame}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    Play Again
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
