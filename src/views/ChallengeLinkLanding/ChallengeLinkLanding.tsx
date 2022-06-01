/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Link } from "react-router-dom";
import swal from "sweetalert2";
import * as data from "data";
import { _, pgettext } from "translate";
import { get, post } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";

import { Card } from "material";
import { SvgBouncer } from "SvgBouncer";
import { Player } from "Player";
import { ChallengeDetailsReviewPane } from "ChallengeDetailsReviewPane";

type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via a challenge-link URL - those point here.
// This page will display a bouncing OGS logo until the challenge given in search param is loaded.
// From there, the user can accept the game - going via login or registration if necessary.

export function ChallengeLinkLanding(): JSX.Element {
    const user = data.get("user");
    const logged_in = !user.anonymous;

    /* State */
    const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);
    const [ask_to_login, set_ask_to_login] = React.useState<boolean>(false);

    /* Actions */

    const doAcceptance = (challenge: Challenge) => {
        swal({
            text: "Accepting game...",
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        }).catch(swal.noop);

        post("challenges/%%/accept", challenge.challenge_id, {})
            .then(() => {
                swal.close();
                browserHistory.push(`/game/${challenge.game_id}`);
            })
            .catch((err) => {
                swal.close();
                errorAlerter(err);
            });
        data.set("pending_accepted_challenge", null);
    };

    const accept = () => {
        if (logged_in) {
            doAcceptance(linked_challenge);
        } else {
            set_ask_to_login(true);
            // We need to save this here for when we come back after logging in.
            // An alternative is passing this "state" via the URL hash or params, but believe me
            // this does not work out well :)
            data.set("pending_accepted_challenge", linked_challenge);
            console.log("pended", linked_challenge);
        }
    };

    /* Display Logic */

    // ... we need to get the linked challenge, then display it, then have them accept it,
    // possibly logging in or registering them as guest along the way...

    const linked_challenge_uuid = new URLSearchParams(location.search).get("linked-challenge");

    const already_accepted = location.pathname.includes("accepted");

    const pending_accepted_challenge = data.get("pending_accepted_challenge");

    if (already_accepted) {
        console.log("Already accepted", pending_accepted_challenge);
        // we have to guard against being called multiple times
        if (pending_accepted_challenge) {
            doAcceptance(pending_accepted_challenge);
        }
    } else {
        if (!linked_challenge_uuid) {
            console.log("Unexpected arrival at Welcome, without linked challenge id!");
            window.location.pathname = "/";
            return <div />;
        }

        console.log("Challenge: ", linked_challenge_uuid);

        if (linked_challenge_uuid && !linked_challenge) {
            get(`challenges/uu-${linked_challenge_uuid}`)
                .then((challenge) => {
                    set_linked_challenge(challenge);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    /* Render */
    return (
        <div id="ChallengeLinkLanding">
            <h2>
                {logged_in || ask_to_login
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {((!linked_challenge && !already_accepted) || null) && <SvgBouncer />}

            {((linked_challenge && !ask_to_login && !already_accepted) || null) && (
                <Card>
                    <div className="invitation">
                        <span className="invite-text">
                            {pgettext(
                                "The challenger's name and avatar appear on the next line after this",
                                "You have been invited to a game of Go, by",
                            )}
                        </span>
                        <Player icon iconSize={32} user={linked_challenge.user_id} />
                    </div>
                    <hr />
                    <ChallengeDetailsReviewPane challenge={linked_challenge} />
                    <hr />
                    <div className="buttons">
                        <button onClick={accept} className="primary">
                            {_("Accept Game")}
                        </button>
                    </div>
                </Card>
            )}

            {((ask_to_login && !already_accepted) || null) && (
                <div className="login-options">
                    <span>
                        {pgettext(
                            "The user just accepted a challenge via a link, but they are not logged in",
                            "Before you start, we just need you to be logged in!",
                        )}
                    </span>

                    <Card>
                        <div>
                            <span>New to OGS?</span>
                            <Link to="/register" className="btn primary">
                                <b>{_("Proceed as a Guest") /*  */}</b>
                            </Link>
                        </div>
                        <hr />

                        <div>
                            <span>Already have an account?</span>
                            <Link to={`/sign-in#/welcome/accepted`} className="btn primary">
                                <b>{_("Sign In") /*  */}</b>
                            </Link>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
