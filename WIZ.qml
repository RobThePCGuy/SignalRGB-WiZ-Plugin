import QtQuick 2.15
import QtQuick.Layouts 1.15
import QtQuick.Controls 2.15
import QtQuick.Controls.Material 2.15

Item {
    id: rootItem
    anchors.fill: parent
    Rectangle {
        id: instructionsPanel
        width: Math.min(350, parent.width * 0.8)
        height: instructionsCol.implicitHeight
        anchors {
            top: parent.top
            right: parent.right
            margins: 10
        }
        color: theme.background3
        radius: theme.radius
        visible: service.controllers.length === 0

        ColumnLayout {
            id: instructionsCol
            anchors.fill: parent
            anchors.margins: 10

            Label {
                font.pixelSize: 16
                font.family: theme.primaryfont
                font.weight: Font.Bold
                color: theme.primarytextcolor
                text: "WiZ Linking Instructions"
            }
            Label {
                Layout.fillWidth: true
                font.pixelSize: 14
                font.family: theme.secondaryfont
                color: theme.secondarytextcolor
                textFormat: Text.MarkdownText
                wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                text: "*   Ensure the WiZ device is powered on.\n" +
                      "*   The device **must** be connected to your **2.4GHz** WiFi network.\n" +
                      "*   Ensure your computer running SignalRGB is on the **same** local network.\n" +
                      "*   Local UDP network communication must **not** be blocked by your firewall (Ports: 38899/38900)."
            }
        }
    }

    ScrollView {
        anchors.fill: parent
        anchors.margins: 5
        clip: true

        ColumnLayout {
            width: parent.width
            spacing: 10

            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 80
                visible: service.controllers.length === 0

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 10

                    BusyIndicator {
                        id: scanningIndicator
                        height: 30
                        width: height
                        Material.accent: theme.secondarytextcolor
                        running: parent.visible
                    }

                    ColumnLayout{
                        spacing: 2
                        Text {
                            color: theme.secondarytextcolor
                            text: "Searching network for WiZ Devices..."
                            font.pixelSize: 14
                            font.family: theme.secondaryfont
                        }
                        Text {
                            color: theme.secondarytextcolor
                            text: "Ensure devices are on the same 2.4GHz network."
                            font.pixelSize: 12
                            font.family: theme.secondaryfont
                            font.italic: true
                        }
                    }
                }
            }

            Repeater {
                model: service.controllers
                Layout.fillWidth: true

                delegate: Frame {
                    id: deviceFrame
                    property var device: model.modelData.obj
                    Layout.fillWidth: true
                    Material.background: Qt.lighter(theme.background2, 1.1)
                    padding: 15

                    ColumnLayout {
                        width: parent.width
                        spacing: 8

                        RowLayout {
                            Layout.fillWidth: true
                            Text {
                                color: theme.primarytextcolor
                                text: device.modelName ? device.modelName : "WiZ Device"
                                font.pixelSize: 16
                                font.family: theme.primaryfont
                                font.weight: Font.Bold
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                            }
                            Text {
                                text: device.isRGB ? "(RGB)" : (device.isTW ? "(Tunable White)" : "(Unknown Type)")
                                color: device.isRGB ? theme.accentcolor : theme.secondarytextcolor
                                font.pixelSize: 12
                                font.italic: true
                            }
                        }

                        GridLayout {
                            Layout.fillWidth: true
                            columns: 2
                            columnSpacing: 10
                            rowSpacing: 2

                            Label { text: "ID (MAC):"; font.weight: Font.DemiBold; color: theme.secondarytextcolor } // Clarified ID
                            Label { text: device.id ? device.id : "N/A"; color: theme.primarytextcolor; elide: Text.ElideRight }

                            Label { text: "IP Address:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.ip ? device.ip : "Unknown"; color: theme.primarytextcolor }

                            Label { text: "Home ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.homeId !== null ? device.homeId : "N/A"; color: theme.primarytextcolor } // Check for null

                            Label { text: "Room ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.roomId !== null ? device.roomId : "N/A"; color: theme.primarytextcolor } // Changed from device.roomid, Check for null

                            Label { text: "Firmware:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.fwVersion ? device.fwVersion : "N/A"; color: theme.primarytextcolor }

                             Label { text: "Group ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.groupId !== null ? device.groupId : "N/A"; color: theme.primarytextcolor } // Check for null

                        }
                    }
                }
            }
        }
    }
}