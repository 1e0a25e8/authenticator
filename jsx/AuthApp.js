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

                    //TODO: need a better way to manage url state
                    //if you're changing tabs, clear out query string.
                    window.location.search = '';
                }
            }).bind(this));

            if (this.state.selectedTab === 'retrieve' && window.location.search) {
                var keyPattern = /key=([a-z0-9]+)/;
                var match = keyPattern.exec(window.location.search);
                if (match) {
                    this.setState({
                        storageKey: match[1]
                    });
                }
            }
        },

        getInitialState: function(){
            return {
                selectedTab: window.location.hash.substring(1) || 'create',
                currentStep: 1,
                qrCodeUrl: undefined,
                otp: undefined,
                encryptionPhrase: undefined,
                storageKey: undefined,
                // for retrieve steps:
                lookupPhrase: undefined,
                validationMessage: undefined
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
                    !this.state.storageKey?
                    <section key="retrieve-lookup">
                        <div className="page-header">
                            <h2>Retrieve your saved authentication data</h2>
                        </div>
                        <p className="lead">
                            Enter your lookup phrase to fetch your data
                        </p>
                        {this.state.validationMessage? <p className="alert-danger">{this.state.validationMessage}</p> : ''}
                        <div className="row">
                            <div className="col-md-3">
                                Your lookup phrase:
                            </div>
                            <div className="col-md-9">
                                <input type="text" name="lookupPhrase" size="50" onChange={this.retrievalPhraseUpdated} />
                            </div>
                        </div>
                        <div className="row">
                            <button disabled={!this.state.lookupPhrase} onClick={this.retrievalPhraseSubmitted}>Look up my data</button>
                        </div>
                    </section>
                    :
                    !this.state.otp?
                    <section key="retrieve-decrypted">
                        <div className="page-header">
                            <h2>Decrypt your data</h2>
                        </div>
                        <p className="lead">
                            OK, we've found your data, now enter your encryption phrase to decrypt it.
                        </p>
                        {this.state.validationMessage? <p className="alert-danger">{this.state.validationMessage}</p> : ''}
                        <div className="row">
                            <div className="col-md-3">
                                Your encryption phrase:
                            </div>
                            <div className="col-md-9">
                                <input type="password" name="encryptionPhrase" size="50" onChange={this.decryptionPhraseUpdated} />
                            </div>
                        </div>
                        <div className="row">
                            <button disabled={!this.state.encryptionPhrase} onClick={this.decryptionPhraseSubmitted}>Decrypt</button>
                        </div>
                    </section>
                    :
                    <section key="retrieve-totp">
                        <div className="page-header">
                            <h2>Success!</h2>
                        </div>
                        <p className="lead">
                            Your 2-factor authentication credentials...
                        </p>
                        <p>
                            <TotpDisplay otp={this.state.otp} />
                        </p>
                        <p>
                            Thanks for using our site! <a href={"mailto:" + this.props.contactEmail}>Email</a> for feedback...
                        </p>
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
                        {this.state.validationMessage? <p className="alert-danger">{this.state.validationMessage}</p> : ''}
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
                        <div className="page-header">
                            <h2>Enter a lookup phrase</h2>
                        </div>

                        <p className="lead">
                            How do you want to locate your authentication data?
                        </p>

                        <p>
                            Enter a name or phrase that will be used to locate your authentication
                            data. This could be an account name or something more obscure. This phrase
                            never leaves your browser -- we only save a SHA hash of it. If you forget
                            your lookup phrase, your data is lost forever.
                        </p>

                        <div className="row">
                            <div className="col-md-3">
                                Your lookup phrase:
                            </div>
                            <div className="col-md-9">
                                <input type="text" onChange={this.lookupPhraseUpdated} size="50"/>
                            </div>
                        </div>

                        {
                            this.state.storageKey? 
                            <div className="row">
                                <p>
                                    OK! Your lookup phrase looks good...
                                </p>

                                <p>
                                    <button onClick={this.saveToCloud}>Save now</button>
                                </p>
                            </div>
                            : false
                        }
                    </section>
                    :
                    <section>
                        <div className="page-header">
                            <h2>Success!</h2>
                        </div>

                        <p className="lead">Your encrypted TOTP data is saved.</p>

                        <p>
                            You can retrieve it using your lookup phrase or directly here: &nbsp;
                            <a href={this.props.siteLocation + "/?key=" + this.state.storageKey + "#retrieve"}>
                                {this.props.siteLocation + "/?key=" + this.state.storageKey + "#retrieve"}
                            </a>
                        </p>

                        <p>
                            Thanks for using our site! <a href={"mailto:" + this.props.contactEmail}>Email</a> for feedback...
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

        lookupPhraseUpdated: function(ev) {
            var storageKey = undefined;
            var lookupPhrase = ev.target.value;

            if (lookupPhrase.trim()) {
                storageKey = this.createStorageKey(lookupPhrase);
            }

            this.setState({
                storageKey: storageKey
            });
        },

        createStorageKey: function(lookupPhrase) {
            var shaObj = new jsSHA(lookupPhrase, "TEXT");
            return shaObj.getHash("SHA-1", "HEX");
        },

        saveToCloud: function(ev) {
            var lookupKey = this.state.storageKey;
            var encryptionPhrase = this.state.encryptionPhrase;
            var newObject = this.state.otp;

            StoreAnon.storeObject(lookupKey, newObject, encryptionPhrase).done((function(lookupKey) {
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

        encryptionPhraseUpdated: function(ev) {
            var encryptionPhrase1 = this.getDOMNode().querySelector('[name=encryptionPhrase1]').value;
            var encryptionPhrase2 = this.getDOMNode().querySelector('[name=encryptionPhrase2]').value;

            var encryptionPhrase = encryptionPhrase1 === encryptionPhrase2?
                encryptionPhrase1 : undefined;

            this.setState({
                encryptionPhrase: encryptionPhrase
            });
        },

        retrievalPhraseUpdated: function(ev) {
            var lookupPhrase = ev.target.value;
            var validationMessage = undefined;

            if (!lookupPhrase) {
                validationMessage = 'Please enter your lookup phrase';
            }
            
            this.setState({
                validationMessage: validationMessage,
                lookupPhrase: lookupPhrase
            });
        },

        retrievalPhraseSubmitted: function(ev) {
            var storageKey = this.createStorageKey(this.state.lookupPhrase);
            StoreAnon.objectExists(storageKey).done((function(exists) {
                if (exists) {
                    this.setState({
                        validationMessage: undefined,
                        storageKey: storageKey
                    });
                } else {
                    this.setState({
                        validationMessage: 'No data found for that lookup key. Try again?'
                    });
                }

            }).bind(this)).fail((function(err) {
                console.error('error testing object existence: %o', err);
                this.setState({
                    validationMessage: 'Error retrieving object'
                })
            }).bind(this));
        },

        decryptionPhraseUpdated: function(ev) {
            var decryptionPhrase = ev.target.value;
            var validationMessage = undefined;

            if (!decryptionPhrase) {
                validationMessage = 'Please enter your decryptionPhrase phrase';
            }

            this.setState({
                validationMessage: validationMessage,
                encryptionPhrase: decryptionPhrase
            });
        },

        decryptionPhraseSubmitted: function() {
            var lookupKey = this.state.storageKey;
            var decryptionPhrase = this.state.encryptionPhrase;
            StoreAnon.fetchObject(lookupKey, decryptionPhrase).done((function(otp) {
                this.setState({
                    validationMessage: undefined,
                    otp: otp
                });
            }).bind(this)).fail((function(msg) {
                this.setState({
                    validationMessage: 'Error opening up your data: ' + msg
                })
            }).bind(this));
        },

        secretUrlUpdated: function(ev) {
            var qrCodeUrl = ev.target.value;

            qrcode.decode(qrCodeUrl).then((function(qrCodeData) {
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
                    validationMessage: undefined,
                    otp: {
                        issuer: authDataMatch[1],
                        account: authDataMatch[2],
                        secret: authDataMatch[3]
                    }
                });
            }).bind(this), (function(error) {
                this.setState({
                    validationMessage: 'Please enter a valid QR code URI',
                    otp: undefined
                })
            }).bind(this));

            this.setState({
                qrCodeUrl: qrCodeUrl
            });
        }
    });

});