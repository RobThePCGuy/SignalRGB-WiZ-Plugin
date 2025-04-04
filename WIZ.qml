import QtQuick 2.15
import QtQuick.Layouts 1.15
import QtQuick.Controls 2.15
import QtQuick.Controls.Material 2.15

Item {
    id: rootItem
    anchors.fill: parent

    // Instruction Panel (Top Right)
    Rectangle {
        id: instructionsPanel
        width: Math.min(350, parent.width * 0.8) // Responsive width
        height: instructionsCol.implicitHeight // Fit content
        anchors {
            top: parent.top
            right: parent.right
            margins: 10 // Add some margin
        }
        color: theme.background3
        radius: theme.radius
        visible: service.controllers.length === 0 // Only show when no devices found yet

        ColumnLayout {
            id: instructionsCol
            anchors.fill: parent
            anchors.margins: 10

            Label {
                font.pixelSize: 16
                font.family: theme.primaryfont
                font.weight: Font.Bold
                color: theme.primarytextcolor
                text: "WIZ Linking Instructions"
            }
            Label {
                Layout.fillWidth: true
                font.pixelSize: 14
                font.family: theme.secondaryfont // Use secondary font for body
                color: theme.secondarytextcolor
                textFormat: Text.MarkdownText
                wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                // Using list formatting for better readability
                text: "*   Ensure the WIZ device is powered on.\n" +
                      "*   The device **must** be connected to your **2.4GHz** WiFi network.\n" +
                      "*   Ensure your computer running SignalRGB is on the **same** local network.\n" +
                      "*   Local UDP network communication must **not** be blocked by your firewall (Ports: 38899/38900)."
            }
        }
    }

    // Main Content Area
    ScrollView {
        anchors.fill: parent
        anchors.margins: 5
        clip: true

        ColumnLayout {
            width: parent.width
            spacing: 10

            // Scanning Indicator (Centered when no devices)
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
                        Material.accent: theme.secondarytextcolor // Use theme color
                        running: parent.visible
                    }

                    ColumnLayout{
                        spacing: 2
                        Text {
                            color: theme.secondarytextcolor
                            text: "Searching network for WIZ Devices..."
                            font.pixelSize: 14
                            font.family: theme.secondaryfont
                        }
                        Text {
                            color: theme.secondarytextcolor
                            text: "Ensure devices are on the same 2.4GHz network."
                            font.pixelSize: 12 // Slightly smaller hint
                            font.family: theme.secondaryfont
                            font.italic: true
                        }
                    }
                }
            }

            // Device List
            Repeater {
                model: service.controllers
                Layout.fillWidth: true

                delegate: Frame { // Using Frame for better visual separation
                    id: deviceFrame
                    property var device: model.modelData.obj // Access the JS object directly
                    Layout.fillWidth: true
                    Material.background: Qt.lighter(theme.background2, 1.1) // Slightly lighter background
                    padding: 15

                    ColumnLayout {
                        width: parent.width
                        spacing: 8 // Increased spacing slightly

                        // Device Name and Type
                        RowLayout {
                            Layout.fillWidth: true
                            Text {
                                color: theme.primarytextcolor
                                text: device.modelName ? device.modelName : "WIZ Device" // Fallback name
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

                        // Device Details Grid
                        GridLayout {
                            Layout.fillWidth: true
                            columns: 2
                            columnSpacing: 10
                            rowSpacing: 2

                            // --- Left Column ---
                            Label { text: "ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.id ? device.id : "N/A"; color: theme.primarytextcolor; elide: Text.ElideRight }

                            Label { text: "IP Address:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.ip ? device.ip : "Unknown"; color: theme.primarytextcolor }

                            Label { text: "Home ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.homeId ? device.homeId : "N/A"; color: theme.primarytextcolor }


                            // --- Right Column ---
                            Label { text: "Room ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.roomId ? device.roomId : "N/A"; color: theme.primarytextcolor }

                            Label { text: "Firmware:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.fwVersion ? device.fwVersion : "N/A"; color: theme.primarytextcolor }

                             Label { text: "Group ID:"; font.weight: Font.DemiBold; color: theme.secondarytextcolor }
                            Label { text: device.groupId ? device.groupId : "N/A"; color: theme.primarytextcolor }

                        }

                        // Status/Warning Area (Optional - can add warnings here if needed)
                        // Text {
                        //     Layout.fillWidth: true
                        //     visible: !device.isRGB && !device.isTW // Example: Warning if type unknown
                        //     color: theme.warn
                        //     wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                        //     text: "Device type could not be fully determined. Control might be limited."
                        //     font.pixelSize: 12
                        // }
                    }
                } // End Frame delegate
            } // End Repeater
        } // End ColumnLayout (main content)
    } // End ScrollView
}
