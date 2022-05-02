import React, { Component, useEffect, useState } from 'react';
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import logo from '../assets/logo.png';
import ReactTooltip from 'react-tooltip';
import copy from "copy-to-clipboard";
import { ToastContainer, toast } from 'react-toastify';

const HomePage = ({ user, setLoginUser }) => {
    const [state, setState] = useState({ walletInfo: {}, validatorInterest: false });
    const toggleValidatorInterest = () => {
        setState({ walletInfo: state.walletInfo, validatorInterest: !state.validatorInterest });
        fetch(`${document.location.origin}/api/validators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validatorId: state.walletInfo.address })
        }).then(response => response.json())
        
        fetch(`${document.location.origin}/api/wallet-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validatorInterest: !state.validatorInterest })
        }).then(response => response.json())
    };

    const handleCopy = () => {
        copy(address);
        toast('🦄 Copied!', {
            position: "top-right",
            autoClose: 300,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const test = () => {
        fetch(`${document.location.origin}/api/test-node`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validatorId: state.walletInfo.address })
        }).then(response => response.json())
    };

    useEffect(() => {
        fetch(`${document.location.origin}/api/wallet-info`)
            .then(response => response.json())
            .then(json => setState({ walletInfo: json.walletInfo, validatorInterest: json.validatorInterest }));
    }, [])


    const { address, balance } = state.walletInfo;
    return (
        <div className='HomePage'>
            <div className='AccountDetails'>

                <img className='logo' src={logo}></img>
                <br />
                <div>Welcome to AgroChain</div>
                <br />
                <Container className='WalletInfo'>
                    <Row className='WalletInfoRowMiddle'>
                        <Col className='WalletInfoColumn'>Name</Col>
                        <Col className='WalletInfoColumnRight' xs={8}>{user.name}</Col>
                    </Row>
                    <Row className='WalletInfoRowMiddle'>
                        <Col className='WalletInfoColumn'>Email</Col>
                        <Col className='WalletInfoColumnRight' xs={8}>{user.email}</Col>
                    </Row>
                    <Row className='WalletInfoRowMiddle'>
                        <Col className='WalletInfoColumn'>Wallet Address</Col>
                        <Col data-tip="Click to copy" data-for="copyTip" className='WalletAddressColumnRight' xs={8} onClick={handleCopy} id="animate.css">{address}
                            <ToastContainer />
                            <ReactTooltip id="copyTip" place="right" type="light" effect="solid">
                                Click to Copy
                            </ReactTooltip>
                        </Col>
                    </Row>
                    <Row className='WalletInfoRowMiddle'>
                        <Col className='WalletInfoColumn'>Balance</Col>
                        <Col className='WalletInfoColumnRight' xs={8}>{balance}</Col>
                    </Row>
                </Container>
            </div>
            <div className='ValidationToggle'>
                <div style={{ fontSize: "12.5px", margin: "10px" }}>Interested in Transaction Validation?</div>
                <BootstrapSwitchButton
                    width={50} onlabel='Yes' offlabel='No' checked={state.validatorInterest}
                    onstyle="danger" offstyle="info"
                    onChange={toggleValidatorInterest} />
            </div>
        </div>
    );

}

export default HomePage;