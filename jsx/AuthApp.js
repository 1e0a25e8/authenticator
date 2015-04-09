define(['jQuery', 'react/react', 'app/QrCodeDisplay', 'app/TotpDisplay', 'jsSHA/sha1', 'StoreAnon'], 

    function($, React, QrCodeDisplay, TotpDisplay, jsSHA, StoreAnon) {

    return React.createClass({

        componentWillMount: function() {
            $(window).on('hashchange', (function(ev) {
                var newTab = window.location.hash.substring(1);
                if (this.state.selectedTab !== newTab) {
                    var newState = this.getInitialState();
                    newState.selectedTab = newTab;
                    this.setState(newState);
                }
            }).bind(this));
        },

        getInitialState: function(){
            return {
                selectedTab: window.location.hash.substring(1) || 'create',
                currentStep: 1,
                qrCodeUrl: undefined,
                otp: undefined,
                encryptionPhrase: undefined,
                storageKey: undefined
            }
        },
   
        render: function() {
            var selectedTab = this.state.selectedTab;
            if (selectedTab === 'contact') {
                return (
                    <section key="contact">
                        <div className="page-header">
                            <h2>Email us...</h2>
                        </div>
                        <p className="lead">
                            <a href={"mailto:" + this.props.contactEmail}>{this.props.contactEmail}</a>
                        </p>
                    </section>
                )
            } else if (selectedTab === 'why') {
                return (
                    <section key="why">
                        <div className="page-header">
                            <h2>Why does this site exist?</h2>
                        </div>
                        <p className="lead">
                            Because I broke my phone. I use 2-factor authentication for my Google account
                            and some other things.
                        </p>
                        <p>
                            If I somehow lose access to my laptop or want to access my Gmail from a new location,
                            I'm screwed without my phone.
                        </p>
                        <p>
                            I want a way to access my 2-factor auth credentials in the case that I have lost
                            access to <em>every</em> service that's important to me. Anonymous. And I don't
                            want to trust some site operator with my data.
                        </p>
                        <p>
                            This site uses AES-256 encryption in Javascript. None of your unencrypted info
                            ever leaves your browser. We store your stuff 100% anonymously. Any questions,
                            check the code out on <a href="https://github.com/1e0a25e8/authenticator">Github</a>.
                        </p>
                        <p>
                            Please <a href={"mailto:" + this.props.contactEmail}>email</a> feedback!
                        </p>
                    </section>
                )
            } else if (selectedTab === 'retrieve') {
                return (
                    <section key="retrieve">
                        {
                            this.state.otp?
                            <TotpDisplay otp={this.state.otp} />
                            : <span>Loading your super secret TOTP data...</span>
                        }
                    </section>
                );
            } else {
                return (
                    this.state.currentStep == 1?
                    <section key="step-1">
                        <div className="page-header">
                            <h2>Save your 2-factor authentication secret in the cloud</h2>
                        </div>
                        <p className="lead">Paste your QR code URL or Data URI here:</p>
                        <p>
                            <input type="text" value={this.state.qrCodeUrl} onChange={this.secretUrlUpdated} /><br/>

                            <div className="container">
                                <div className="row">
                                    <div className="col-md-3">
                                    {
                                        this.state.qrCodeUrl?
                                            <QrCodeDisplay url={this.state.qrCodeUrl} />
                                            :false
                                    }
                                    </div>
                                    <div className="col-md-9">
                                    {
                                        this.state.otp? 
                                            <div>
                                                <TotpDisplay otp={this.state.otp} />
                                            </div>
                                             :false
                                    }
                                    </div>
                                </div>
                                <div className="row">
                                    {this.state.otp?
                                        <button onClick={this.step1done}>Looks good, continue...</button>
                                        : false}
                                </div>
                            </div>
                        </p>
                    </section>
                    : this.state.currentStep == 2?
                    <section key="step-2">
                        <div className="page-header">
                            <h2>Encrypt your secret</h2>
                        </div>
                        <div className="row">
                            <div className="col-md-3">
                                Enter a phrase to encrypt your secret:
                            </div>
                            <div className="col-md-9">
                                <input type="password" name="encryptionPhrase1" onChange={this.encryptionPhraseUpdated} size="50"/>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-3">
                                Confirm your encryption phrase:
                            </div>
                            <div className="col-md-9">
                                <input type="password" name="encryptionPhrase2" onChange={this.encryptionPhraseUpdated} size="50"/>
                            </div>
                        </div>

                        { this.state.encryptionPhrase?
                            <div className="row">
                                <p>Encryption phrases match!</p>
                                <p><button onClick={this.step2done}>Continue to save to cloud...</button></p>
                            </div> : false
                        }
                     </section>
 
                    : this.state.currentStep == 3?
                    <section key="step-3">
                        <p>
                            OK, now enter a lookup phrase. This is just used to locate your 
                            (anonymous) authentication data. It can be long or short as long
                            nobody else has used it and you remember it.
                        </p>

                        <input type="text" name="lookupPhrase1" onChange={this.lookupPhraseUpdated} /><br/>
                        <input type="text" name="lookupPhrase2" onChange={this.lookupPhraseUpdated} />

                        {
                            this.state.storageKey? 
                            <p>
                                OK! Your lookup phrase looks good... ({this.state.storageKey})
                                <button onClick={this.saveToCloud}>Ready to save?</button>
                            </p>
                            : false
                        }
                    </section>
                    :
                    <section>
                        <div className="page-header">
                            <h2>OK!</h2>
                        </div>

                        <p className="lead">Your encrypted TOTP data is saved.</p>

                        <p>
                            You can retrieve it using your lookup phrase or directly here:
                            <a href={this.props.siteLocation + "/?key=" + this.state.storageKey + "#retrieve"}>
                                {this.props.siteLocation + "/?key=" + this.state.storageKey + "#retrieve"}
                            </a>
                        </p>

                        <p>
                            Thanks for using our site! <a href={this.props.contactEmail}>Email</a> for feedback...
                        </p>
                    </section>

                );
            }
        },

        step1done: function() {
            this.setState({
                currentStep: 2
            });
        },

        step2done: function() {
            this.setState({
                currentStep: 3
            });
        },

        lookupPhraseUpdated: function() {
            var storageKey = undefined;
            var lookupPhrase1 = this.getDOMNode().querySelector('[name=lookupPhrase1]').value;
            var lookupPhrase2 = this.getDOMNode().querySelector('[name=lookupPhrase2]').value;

            if (lookupPhrase1 === lookupPhrase2) {
                var shaObj = new jsSHA(lookupPhrase1, "TEXT");
                storageKey = shaObj.getHash("SHA-1", "HEX");
            }

            this.setState({
                storageKey: storageKey
            });
        },

        saveToCloud: function(ev) {
            var lookupKey = this.state.storageKey;
            var encryptionPassphrase = this.state.encryptionPhrase;
            var newObject = this.state.otp;

            StoreAnon.storeObject(lookupKey, newObject, encryptionPassphrase).done((function(lookupKey) {
                // ok, we're done! update step and clear out all the private-ish data.
                this.setState({
                    currentStep: 4,
                    qrCodeUrl: undefined,
                    otp: undefined,
                    encryptionPhrase: undefined
                });
            }).bind(this)).fail(function(err) {
                throw 'save failed: ' + err;
            });
        },

        loadTotp: function(lookupKey, encryptionPassphrase) {
            StoreAnon.fetchObject(lookupKey, encryptionPassphrase).done((function(otp) {
                this.setState({
                    otp: otp
                });
            }).bind(this)).fail(function() {
                console.log('error getting totp info: %o', arguments);
                throw 'whoops'
            })
        },

        encryptionPhraseUpdated: function(ev) {
            var encryptionPhrase1 = this.getDOMNode().querySelector('[name=encryptionPhrase1]').value;
            var encryptionPhrase2 = this.getDOMNode().querySelector('[name=encryptionPhrase2]').value;

            var encryptionPhrase = encryptionPhrase1 === encryptionPhrase2?
                encryptionPhrase1 : undefined;

            this.setState({
                encryptionPhrase: encryptionPhrase
            });
        },

        secretUrlUpdated: function(ev) {
            var qrCodeUrl = ev.target.value;

            qrcode.callback = (function(qrCodeData) {
                // otpauth://totp/Google%3Asomebody%40gmail.com?secret=p5ytcate53w3r5anysh3kuinuhz2b2wp&issuer=Google
                var otpAuthPattern = /otpauth\:\/\/totp\/(.*)/;
                var match = otpAuthPattern.exec(qrCodeData);
                if (!match) {
                    throw new Error('qrCode does not contain otpauth data: ' + qrCodeData);
                }

                var authData = match[1];
                authData = unescape(authData);
                // provider:emailaddress?secret=abcABC123[&issuer=Provider]
                var authDataPattern = /(.*):(.*)\?.*secret=(\w*)/;
                var authDataMatch = authDataPattern.exec(authData);

                this.setState({
                    otp: {
                        issuer: authDataMatch[1],
                        account: authDataMatch[2],
                        secret: authDataMatch[3]
                    }
                });
            }).bind(this);

            // TODO: wrap jsqrcode to better handle errors.
            var result = qrcode.decode(qrCodeUrl);

            this.setState({
                qrCodeUrl: qrCodeUrl
            });
        }
    });

});