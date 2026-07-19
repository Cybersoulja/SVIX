EXTERNAL generate_element(type)
EXTERNAL trigger_webhook(payload)

VAR player_name = "Wanderer"
VAR player_health = 100
VAR current_weapon = "Rusty Dagger"
VAR tavern_name = ""
VAR monster_name = ""
VAR sword_name = ""

~ tavern_name = generate_element("tavern")
~ monster_name = generate_element("monster")
~ sword_name = generate_element("sword")

-> start_adventure

=== start_adventure ===
You find yourself standing before {tavern_name}. The journey has been long, and the local rumors speak of a creature haunting the nearby woods.

+ [Enter the tavern]
    -> inside_tavern
+ [Head straight to the woods]
    -> the_woods

=== inside_tavern ===
The air inside {tavern_name} is thick with smoke and whispered tales. The barkeep notices you and slides over a mug of ale.
"You look like you're hunting the {monster_name}," he says. "You'll need more than a {current_weapon}."
He reaches under the counter and pulls out a weapon.
"{sword_name}" he explains. "Take it."

~ current_weapon = sword_name

+ [Take the weapon and leave for the woods]
    -> the_woods
+ [Decline and leave for the woods]
    "I trust my {current_weapon}," you reply, stepping back into the night.
    ~ current_weapon = "Rusty Dagger"
    -> the_woods

=== the_woods ===
The trees are dense, blocking out the moonlight. Suddenly, the {monster_name} leaps from the shadows!

+ [Attack with your {current_weapon}]
    -> combat
+ [Flee back to {tavern_name}]
    -> coward_ending

=== combat ===
{ current_weapon == "Rusty Dagger":
    Your {current_weapon} shatters against the hide of the {monster_name}. You are defeated.
    ~ player_health = 0
    -> bad_ending
- else:
    You swing the legendary weapon. The {monster_name} stands no chance and falls before you.
    -> good_ending
}

=== bad_ending ===
You have fallen in battle.
~ trigger_webhook("game_over")
-> DONE

=== good_ending ===
You stand victorious over the beast. The village is safe.
~ trigger_webhook("victory")
-> DONE

=== coward_ending ===
You run away, leaving the village to its fate.
~ trigger_webhook("cowardice")
-> DONE
