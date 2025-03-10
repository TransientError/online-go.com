/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { Modal, openModal } from "@/components/Modal";
import { GobanRenderer } from "goban";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { MiniGoban } from "@/components/MiniGoban";
import { challenge } from "@/components/ChallengeModal";
import { PlayerCacheEntry } from "@/lib/player_cache";

interface Events {}

interface ForkModalProperties {
    goban: GobanRenderer;
}

export class ForkModal extends Modal<Events, ForkModalProperties, any> {
    constructor(props: ForkModalProperties) {
        super(props);

        const goban = this.props.goban;
        this.state = {
            player: null,
            fork_preview: {
                //"moves": goban.engine.cur_move.getMoveStringToThisPoint(),
                //"initial_state": goban.engine.initial_state,
                //"initial_player": goban.engine.config.initial_player,
                moves: [],
                initial_state: goban.engine.computeInitialStateForForkedGame(),
                initial_player: goban.engine.colorToMove(),
                width: goban.engine.width,
                height: goban.engine.height,
                rules: goban.engine.rules,
                handicap: goban.engine.handicap,
                komi: goban.engine.komi,
                move_number: goban.engine.getMoveNumber(),
                game_name: goban.engine.name,
            },
        };
    }

    openChallengeModal = () => {
        this.close();
        challenge(this.state.player.id, this.state.fork_preview);
    };

    setPlayer = (player: PlayerCacheEntry | null) => {
        this.setState({ player: player });
    };

    render() {
        return (
            <div className="Modal ForkModal">
                <div className="header space-around">
                    <h2>{_("Player to challenge")}:</h2>{" "}
                    <PlayerAutocomplete onComplete={this.setPlayer} />
                </div>
                <div className="body space-around">
                    <MiniGoban
                        game_id={0}
                        black={undefined}
                        white={undefined}
                        json={this.state.fork_preview}
                        noLink
                    />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button
                        className="primary"
                        disabled={
                            this.state.player == null ||
                            this.state.player.id === data.get("user").id
                        }
                        onClick={this.openChallengeModal}
                    >
                        {_("Game settings")} &rarr;
                    </button>
                </div>
            </div>
        );
    }
}

export function openForkModal(goban: GobanRenderer) {
    return openModal(<ForkModal goban={goban} />);
}
export function challengeFromBoardPosition(goban: GobanRenderer) {
    if (!goban) {
        return;
    }

    openForkModal(goban);
}
